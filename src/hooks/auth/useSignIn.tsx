/* eslint-disable @typescript-eslint/no-explicit-any */

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useCustomMutation } from "@/hooks/api/use-api";
import { useAppStore } from "@/lib/core";
import { updateUserObject } from "@/services/features/auth/authSlice";
import { showErrorToast } from "@/utils/toastUtils";

interface UseSignInProps {
  setNotVerifiedError: (value: boolean) => void;
  setErrorMessage?: (value: string | null) => void;
  endpoint: string;
}

interface AuthUserObject {
  email?: string;
  role?: string;
  usid?: string;
  [key: string]: unknown;
}

function getAuthErrorMessage(error: any): string {
  return (
    error?.response?.data?.data?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export const useSignIn = ({
  setNotVerifiedError,
  setErrorMessage,
  endpoint,
}: UseSignInProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
   * Temporary bridge:
   * AppLayout still uses Zustand's `authed` value.
   * Remove this after AppLayout is converted to Redux authentication.
   */
  const setAuthed = useAppStore((state) => state.setAuthed);

  const signInMutation = useCustomMutation<any, any, any>({
    endpoint,
    method: "post",

    successMessage: (data) =>
      data?.message || data?.data?.message || "Login successful",

    errorMessage: (error) => getAuthErrorMessage(error),

    onSuccessCallback: (data) => {
      setNotVerifiedError(false);
      setErrorMessage?.(null);

      /*
       * Supports responses shaped like:
       *
       * { accessToken, refreshToken }
       * { data: { accessToken, refreshToken } }
       * { data: { data: { accessToken, refreshToken } } }
       */
      const responseData = data?.data?.data ?? data?.data ?? data;

      const accessToken =
        responseData?.accessToken ??
        responseData?.access_token ??
        responseData?.token;

      const refreshToken =
        responseData?.refreshToken ?? responseData?.refresh_token;

      if (!accessToken) {
        console.error("❌ [useSignIn] Access token missing:", data);

        showErrorToast(
          "Login completed, but the server did not return an access token.",
        );

        return;
      }

      const returnedUser =
        responseData?.user ?? responseData?.userObject ?? responseData;

      const userObject: AuthUserObject = {
        ...returnedUser,

        email: returnedUser?.email ?? responseData?.email,

        role: returnedUser?.role ?? responseData?.role,

        usid:
          returnedUser?.usid ??
          returnedUser?.userId ??
          returnedUser?.fanfam ??
          responseData?.usid ??
          responseData?.userId ??
          responseData?.fanfam,
      };

      localStorage.setItem("token", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      localStorage.setItem("userObject", JSON.stringify(userObject));

      dispatch(updateUserObject(userObject));

      /*
       * Required while the new AppLayout is still using
       * Zustand for its mocked authentication guard.
       */
      setAuthed(true);

      window.dispatchEvent(new Event("auth-complete"));

      // Your router has /feed, not /dashboard.
      navigate("/feed", {
        replace: true,
      });
    },

    onError: (error: any) => {
      const message = getAuthErrorMessage(error);

      const isNotVerified =
        message.toLowerCase() === "account has not been verified";

      setNotVerifiedError(isNotVerified);
      setErrorMessage?.(message);

      console.error("❌ [useSignIn] Login failed:", error);

      /*
       * Do not call showErrorToast here.
       * useCustomMutation already shows the message returned
       * by errorMessage, otherwise you will get two toasts.
       */
    },
  });

  return signInMutation;
};
