// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { PasswordField } from "@/components/auth";
// import { SettingsBack, SettingsNav } from "@/components/settings-nav";
// import { useAppStore } from "@/lib/core";

// export default function SettingsPasswordPage() {
//   const navigate = useNavigate();
//   const S = useAppStore();
//   const [current, setCurrent] = useState("");
//   const [next, setNext] = useState("");
//   const [confirm, setConfirm] = useState("");

//   const mismatch = confirm.length > 0 && next !== confirm;
//   const canSave = current.length > 0 && next.length >= 8 && next === confirm;

//   const save = () => {
//     if (!canSave) return;
//     S.toast("Password changed", "ok");
//     navigate("/settings");
//   };

//   return (
//     <div className="content" style={{ maxWidth: 980 }}>
//       <div className="split" style={{ alignItems: "flex-start" }}>
//         <SettingsNav />
//         <div className="col gap12" style={{ maxWidth: 420, width: "100%" }}>
//           <SettingsBack />
//           <PasswordField id="current-password" value={current} onChange={setCurrent}
//             placeholder="Current password" autoComplete="current-password" />
//           <PasswordField id="new-password" value={next} onChange={setNext}
//             placeholder="New password" autoComplete="new-password" />
//           <PasswordField id="confirm-password" value={confirm} onChange={setConfirm}
//             placeholder="Confirm new password" autoComplete="new-password" />
//           {mismatch && <div className="coral t12">Passwords don&apos;t match</div>}
//           <button className="btn btn-blue" style={{ marginTop: 6 }} disabled={!canSave} onClick={save}>
//             Save password
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { PasswordField } from "@/components/auth";
import { SettingsBack, SettingsNav } from "@/components/settings-nav";
import { useAppStore } from "@/lib/core";
import { useAppSelector } from "@/services/hook";
import { RootState } from "@/services/store";
import { useCustomMutation } from "@/hooks/api/use-api";

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SettingsPasswordPage() {
  const navigate = useNavigate();
  const S = useAppStore();
  const { userObject } = useAppSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const next = watch("newPassword");

  const changePasswordMutation = useCustomMutation({
    endpoint: "auth/update-password",
    successMessage: (data: any) => data?.data?.message,
    errorMessage: (error: any) => error,
    onSuccessCallback: (data: any) => {
      S.toast(data?.message || "Password changed", "ok");
      navigate("/settings");
    },
  });

  const submitForm = (data: FormValues) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      email: userObject?.email,
    });
  };

  return (
    <div className="content" style={{ maxWidth: 980 }}>
      <div className="split" style={{ alignItems: "flex-start" }}>
        <SettingsNav />
        <form
          className="col gap12"
          style={{ maxWidth: 420, width: "100%" }}
          onSubmit={handleSubmit(submitForm)}
        >
          <SettingsBack />

          <div>
            <Controller
              name="currentPassword"
              control={control}
              rules={{ required: "Current password is required" }}
              render={({ field }) => (
                <PasswordField
                  id="current-password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.currentPassword && (
              <div className="coral t12" style={{ marginTop: 6 }}>
                {errors.currentPassword.message}
              </div>
            )}
          </div>

          <div>
            <Controller
              name="newPassword"
              control={control}
              rules={{
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              }}
              render={({ field }) => (
                <PasswordField
                  id="new-password"
                  placeholder="New password"
                  autoComplete="new-password"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.newPassword && (
              <div className="coral t12" style={{ marginTop: 6 }}>
                {errors.newPassword.message}
              </div>
            )}
          </div>

          <div>
            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required: "Please confirm your new password",
                validate: (value) => value === next || "Passwords don't match",
              }}
              render={({ field }) => (
                <PasswordField
                  id="confirm-password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.confirmPassword && (
              <div className="coral t12" style={{ marginTop: 6 }}>
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-blue"
            style={{ marginTop: 6 }}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
