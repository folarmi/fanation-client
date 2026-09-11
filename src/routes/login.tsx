import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import CustomInput from "@/components/custom-input";
import { AuthThemeToggle } from "@/components/theme";
import { useCustomMutation } from "@/hooks/api/use-api";
// import { useAppStore } from "@/lib/core";
import { Logo } from "@/lib/ui";
// import { updateUserObject } from "@/services/features/auth/authSlice";
import {
  fetchDeviceIP,
  getBrowserInfo,
  getDeviceOS,
  getPlatformFromUAParser,
  getReadableLocation,
} from "@/utils/helper";
import { showErrorToast } from "@/utils/toastUtils";
import { useSignIn } from "@/hooks/auth/useSignIn";
import { useDeviceMetadata } from "@/hooks/auth/use-device-metadata";
import { getFCMToken } from "@/services/firebase";

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type ResendVerificationVariables = {
  params: {
    email: string;
  };
  body: Record<string, never>;
};

export default function Login() {
  const navigate = useNavigate();
  const deviceMetadata = useDeviceMetadata();
  const platform = getPlatformFromUAParser();
  const browser = getBrowserInfo();

  const [ip, setIp] = useState<string>("");
  const [notVerifiedError, setNotVerifiedError] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [, setError] = useState<string | null>(null);

  const { control, handleSubmit, getValues, register } =
    useForm<LoginFormValues>({
      mode: "onBlur",
      defaultValues: {
        email: "",
        password: "",
        rememberMe: true,
      },
    });

  const signInMutation = useSignIn({
    setNotVerifiedError,
    endpoint: "auth/login",
  });

  // const dispatch = useDispatch();
  // const setAuthed = useAppStore((state) => state.setAuthed);

  useEffect(() => {
    const fetchIP = async () => {
      const deviceIP = await fetchDeviceIP();
      setIp(deviceIP);
    };

    fetchIP();
  }, []);

  useEffect(() => {
    getReadableLocation()
      .then((result) => {
        if (result.success && result.location) {
          setLocation(result.location);
        } else {
          setError(result.error || "Failed to get location");
        }
      })
      .catch((err) => setError(err.message || "An unexpected error occurred"));
  }, []);

  const resendVerificationMutation = useCustomMutation<
    unknown,
    unknown,
    ResendVerificationVariables
  >({
    endpoint: "auth/resend-verification-link",
    method: "post",
    useQueryParams: true,
    successMessage: (data: any) => data?.message || "Verification email sent",
  });

  // const onSubmit = async (values: LoginFormValues) => {
  //   /*
  //    * VITE_PUBLIC_BASE_URL is blank locally — there is no backend for
  //    * `auth/login` to reach, so a real sign-in always fails here. This
  //    * bypass stands in for it in dev builds only (`import.meta.env.DEV`
  //    * is stripped from production bundles), accepting whatever the form
  //    * was submitted with rather than a hardcoded credential.
  //    */
  //   if (import.meta.env.DEV) {
  //     localStorage.setItem("token", "dev-preview-token");

  //     const userObject = {
  //       email: values.email,
  //       role: "creator",
  //       usid: "dev-preview",
  //     };
  //     localStorage.setItem("userObject", JSON.stringify(userObject));
  //     dispatch(updateUserObject(userObject));
  //     setAuthed(true);

  //     window.dispatchEvent(new Event("auth-complete"));
  //     navigate("/feed", { replace: true });
  //     return;
  //   }

  //   const firebaseClientToken = await getNotificationToken();

  //   signInMutation.mutate({
  //     email: values.email,
  //     password: values.password,

  //     deviceMeta: {
  //       deviceOS: getDeviceOS(),
  //       deviceIP: deviceMetadata.ip,
  //       location: deviceMetadata.location,
  //       platform: deviceMetadata.platform,
  //       browser: deviceMetadata.browser,
  //       firebaseClientToken,
  //     },
  //   });
  // };

  const onSubmit = async (data: LoginFormValues) => {
    let fcmToken = null;

    try {
      // Check current permission

      // If permission is blocked, inform user
      if (Notification.permission === "denied") {
        console.warn(
          "⚠️ Notification permission is blocked. User needs to enable it in browser settings.",
        );

        showErrorToast({
          type: "warning",
          title:
            "Please enable notifications in your browser settings to receive updates",
        });
      } else if (Notification.permission === "default") {
        // Request permission if not yet asked
        const permission = await Notification.requestPermission();
        console.log("Permission request result:", permission);

        if (permission === "granted") {
          fcmToken = await getFCMToken();
        }
      } else if (Notification.permission === "granted") {
        // Permission already granted
        fcmToken = await getFCMToken();
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      // Don't block login if FCM token fails
    }

    const formValues = {
      email: data.email,
      password: data.password,
      deviceMeta: {
        deviceOS: getDeviceOS(),
        deviceIP: ip,
        location: location,
        platform: platform,
        browser: browser,
        firebaseClientToken: fcmToken,
      },
    };

    signInMutation?.mutate(formValues);
  };

  const resendVerificationEmail = () => {
    const email = getValues("email");

    if (!email) {
      showErrorToast("Enter your email address first.");
      return;
    }

    resendVerificationMutation.mutate({
      params: {
        email,
      },
      body: {},
    });
  };

  return (
    <div className="authwrap">
      <AuthThemeToggle />

      <div className="authform">
        <div className="authinner">
          <div className="authbrand">
            <Logo />
          </div>

          <div
            className="display"
            style={{
              fontSize: 30,
              marginBottom: 6,
            }}
          >
            Welcome back
          </div>

          <div
            className="muted t14"
            style={{
              marginBottom: 22,
            }}
          >
            Sign in to pick up where you left off.
          </div>

          <form
            className="card"
            style={{ padding: 26 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <SocialAuthButtons
              {...deviceMetadata}
              endpoint="auth/login/oauth2"
            />

            <div className="authdiv">or with email</div>

            <CustomInput<LoginFormValues>
              name="email"
              id="login-email"
              control={control}
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
            />

            <div className="row between" style={{ marginBottom: 7 }}>
              <label
                className="label"
                htmlFor="login-password"
                style={{ marginBottom: 0 }}
              >
                Password
              </label>

              <button
                type="button"
                className="blue t12 b6"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <CustomInput<LoginFormValues>
              name="password"
              id="login-password"
              control={control}
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="auth-input-last"
              rules={{
                required: "Password is required",
              }}
            />

            {notVerifiedError && (
              <button
                type="button"
                className="blue t12 b6"
                style={{
                  display: "block",
                  marginLeft: "auto",
                  marginTop: 8,
                }}
                disabled={resendVerificationMutation.isPending}
                onClick={resendVerificationEmail}
              >
                {resendVerificationMutation.isPending
                  ? "Sending..."
                  : "Resend verification email"}
              </button>
            )}

            <label
              className="row gap8 muted t13"
              style={{
                margin: "14px 0 16px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                {...register("rememberMe")}
                style={{
                  width: 15,
                  height: 15,
                  accentColor: "var(--blue)",
                }}
              />

              <span>Keep me signed in for 30 days</span>
            </label>

            <button
              type="submit"
              className="btn btn-blue btn-block"
              disabled={signInMutation.isPending}
            >
              {signInMutation.isPending ? "Signing in..." : "Sign in"}
            </button>

            <div
              className="row center muted t14"
              style={{
                marginTop: 16,
                gap: 5,
              }}
            >
              <span>Don&apos;t have an account?</span>

              <button
                type="button"
                className="blue b6"
                onClick={() => navigate("/signup")}
              >
                Create one
              </button>
            </div>
          </form>

          <AuthLegal verb="continuing" />
        </div>
      </div>

      <AuthHero
        title="Your audience. Your terms."
        sub="Subscriptions, pay-per-view drops, live gifting and coins — one account, one payout, same day. Creators on Fanation keep the relationship and the revenue."
      />
    </div>
  );
}

// const getNotificationToken = async () => {
//   if (!("Notification" in window)) {
//     return null;
//   }

//   try {
//     if (Notification.permission === "denied") {
//       showToast(
//         "Please enable notifications in your browser settings to receive updates.",
//         "warning",
//       );

//       return null;
//     }

//     if (Notification.permission === "default") {
//       const permission = await Notification.requestPermission();

//       if (permission !== "granted") {
//         return null;
//       }
//     }

//     return await getFCMToken();
//   } catch (error) {
//     console.error("Unable to retrieve FCM token:", error);
//     return null;
//   }
// };
