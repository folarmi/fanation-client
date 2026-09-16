/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = import.meta.env.VITE_PUBLIC_BASE_URL;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const EAON_HEADERS = {
  EAONCREDENTIALKEY:
    "K1T2U3V4W5X6Y7Z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S4Y5Z6a7b8c9d0e1f2",
  EAONCREDENTIALVALUE:
    "V1T2bR3yL4FpU5qZvS6xC7dG8hIoJ9kApLbQcM1uN2vXwO3xY4zU5hV6mB7nC8oD9pE0qF1rG2sH3tI4uJ5vK6wL7xM8yN9zA0bB1cC2dD3eE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ50A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X",
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function isAuthUrl(url?: string) {
  return (
    url?.includes("auth/login") ||
    url?.includes("auth/register") ||
    url?.includes("auth/verify") ||
    url?.includes("waitlist/join") ||
    url?.includes("auth/refresh") ||
    url?.includes("auth/forgot-password") ||
    url?.includes("auth/resend-verification-link") ||
    url?.includes("auth/reset-password")
  );
}

let hasForcedLogout = false;

function forceLogout() {
  if (hasForcedLogout) return;
  hasForcedLogout = true;

  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userObject");

  delete api.defaults.headers.common.Authorization;

  window.dispatchEvent(new Event("force-logout"));

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = isAuthUrl(config.url);

    const token = localStorage.getItem("token");

    config.headers = config.headers ?? {};

    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    Object.assign(config.headers, EAON_HEADERS);

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthToast?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    const isAuthEndpoint = isAuthUrl(originalRequest.url);

    // 401 = not authenticated (missing/invalid/expired token) - this is the
    // only status that should ever trigger a logout/refresh flow.
    // 403 = authenticated but not allowed to do this (a permissions issue) -
    // it must NOT log the user out, or every "you can't do that" response
    // would silently kill their session.
    const isAuthFailure = status === 401;

    if (status === 401 || status === 403) {
      console.error(
        `❌ [Axios Response] ${status} for ${originalRequest?.url}`,
      );
    }

    // Do not refresh/retry auth endpoints to avoid loops
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Not an auth failure, let normal mutation/query error handling continue
    if (!isAuthFailure) {
      return Promise.reject(error);
    }

    // Mark auth errors so your toast layer can ignore them if you use this flag
    originalRequest._skipAuthToast = true;

    // If the request was already retried once and still 401'd, the session
    // really is invalid - log out.
    if (originalRequest._retry) {
      forceLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      // No refresh-token flow wired up yet (backend migration in progress).
      // Rather than logging out on the very first 401, retry the request
      // once with the same token: a genuinely dead token will just 401
      // again (and then we log out above), but a one-off/flaky 401 gets a
      // second chance instead of nuking the whole session.
      return api(originalRequest);
    }

    // If refresh is already happening, queue this failed request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshUrl = BASE_URL?.endsWith("/")
        ? `${BASE_URL}auth/refresh`
        : `${BASE_URL}/auth/refresh`;

      const { data } = await axios.post(
        refreshUrl,
        { token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            ...EAON_HEADERS,
          },
        },
      );

      const newToken =
        data?.accessToken || data?.token || data?.data?.accessToken;

      const newRefreshToken = data?.refreshToken || data?.data?.refreshToken;

      if (!newToken) {
        forceLogout();
        onTokenRefreshed(null);
        return Promise.reject(error);
      }

      localStorage.setItem("token", newToken);

      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      onTokenRefreshed(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      console.error("❌ [Token Refresh] Refresh failed:", refreshError);

      onTokenRefreshed(null);
      forceLogout();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
