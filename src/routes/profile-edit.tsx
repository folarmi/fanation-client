// import { useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAppStore } from "@/lib/core";
// import { Avatar, Icon, Menu, Photo, SIZES, coverFor } from "@/lib/ui";

// const GENDERS = ["Prefer not to say", "Female", "Male", "Non-binary"];

// /** A file the browser just handed us, as a data URL — the only place an
//     uploaded image can live with no storage endpoint behind it. */
// const readAsDataUrl = (file: File): Promise<string> =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = () => reject(reader.error);
//     reader.readAsDataURL(file);
//   });

// function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
//   return (
//     <div>
//       <label className="label" htmlFor={htmlFor}>{label}</label>
//       {children}
//     </div>
//   );
// }

// /**
//  * A full page rather than a modal — enough fields (name, handle, gender,
//  * email, location, interest, bio, two photos) that a small popup would
//  * either scroll awkwardly or get cramped. Cover, avatar and the save/menu
//  * row live in one header block; everything else is a plain labelled list,
//  * same `.input`/`.label` pieces every other form in this app already uses.
//  */
// export default function EditProfilePage() {
//   const navigate = useNavigate();
//   const S = useAppStore();
//   const p = S.profile;

//   const [fullName, setFullName] = useState(p.fullName);
//   const [name, setName] = useState(p.name);
//   const [handle, setHandle] = useState(p.handle);
//   const [email, setEmail] = useState(p.email);
//   const [gender, setGender] = useState(p.gender);
//   const [location, setLocation] = useState(p.location);
//   const [interest, setInterest] = useState(p.interest);
//   const [bio, setBio] = useState(p.bio);
//   const [avatarUrl, setAvatarUrl] = useState(p.avatarUrl);
//   const [coverUrl, setCoverUrl] = useState(p.coverUrl);

//   const avatarInput = useRef<HTMLInputElement>(null);
//   const coverInput = useRef<HTMLInputElement>(null);

//   const nameErr = name.trim().length < 2 ? "Display name must be at least 2 characters" : null;
//   const handleErr = !/^[A-Za-z0-9_]{3,}$/.test(handle)
//     ? "3+ characters, letters, numbers and underscores only"
//     : null;

//   const pickImage = async (e: React.ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => {
//     const file = e.target.files?.[0];
//     e.target.value = ""; // clears the value so picking the same file twice still fires onChange
//     if (file) apply(await readAsDataUrl(file));
//   };

//   const save = () => {
//     if (nameErr || handleErr) return;
//     S.updateProfile({
//       fullName: fullName.trim(), name: name.trim(), handle: handle.trim(),
//       email: email.trim(), gender, location: location.trim(), interest: interest.trim(), bio: bio.trim(),
//       avatarUrl, coverUrl,
//     });
//     navigate("/profile");
//   };

//   return (
//     <div className="content" style={{ maxWidth: 680 }}>
//       <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => navigate("/profile")}>
//         <span className="row" style={{ transform: "rotate(180deg)" }}><Icon n="arrow" s={15} /></span>
//         Back to profile
//       </button>

//       <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => pickImage(e, setCoverUrl)} />
//       <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => pickImage(e, setAvatarUrl)} />

//       <div className="card" style={{ padding: 0, overflow: "visible", marginTop: 14, marginBottom: 56 }}>
//         <div style={{ height: 140, borderRadius: "var(--r) var(--r) 0 0", overflow: "hidden", position: "relative", cursor: "pointer" }}
//           onClick={() => coverInput.current?.click()}>
//           {coverUrl ? (
//             <img src={coverUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
//           ) : (
//             <Photo sizes={SIZES.cover} src={coverFor(handle)} seed={handle} />
//           )}
//           <div className="row center gap6 onart" style={{ position: "absolute", right: 12, bottom: 12, padding: "6px 12px", borderRadius: 999 }}>
//             <Icon n="camera" s={13} c="#fff" /><span className="t12 b6" style={{ color: "#fff" }}>Change cover</span>
//           </div>
//         </div>

//         <div className="row center" style={{ marginTop: -48 }}>
//           <div style={{ position: "relative", cursor: "pointer" }} onClick={() => avatarInput.current?.click()}>
//             <div style={{ width: 96, height: 96, boxSizing: "border-box", border: "4px solid var(--card)", borderRadius: "50%", position: "relative" }}>
//               <Avatar name={name} size={88} src={avatarUrl} />
//             </div>
//             <div className="row center" style={{ position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: "50%", background: "var(--blue)", border: "2px solid var(--card)" }}>
//               <Icon n="camera" s={13} c="#fff" />
//             </div>
//           </div>
//         </div>

//         <div className="row gap10" style={{ justifyContent: "flex-end", padding: "14px 18px 18px" }}>
//           <button className="btn btn-blue btn-sm" disabled={!!nameErr || !!handleErr} onClick={save}>Save profile</button>
//           <Menu
//             align="right"
//             trigger={<button className="btn btn-ghost btn-sm" style={{ padding: "8px 10px" }}><Icon n="more" s={16} /></button>}
//             items={[
//               { ic: "logout", t: "Log out", fn: () => S.openModal("logout") },
//               { ic: "x", t: "Delete account", danger: true, fn: () => S.toast("Account deletion requires email confirmation — check your inbox", "err") },
//             ]}
//           />
//         </div>
//       </div>

//       <div className="col gap16">
//         <Field label="Full name" htmlFor="pe-fullname">
//           <input id="pe-fullname" className="input" value={fullName} maxLength={60} onChange={(e) => setFullName(e.target.value)} />
//         </Field>

//         <Field label="Display name" htmlFor="pe-name">
//           <input id="pe-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
//             style={{ borderColor: nameErr ? "rgba(243,106,70,.5)" : undefined }} />
//           {nameErr && <div className="coral t12" style={{ marginTop: 6 }}>{nameErr}</div>}
//         </Field>

//         <Field label="Username" htmlFor="pe-handle">
//           <div className="row hair" style={{ padding: "0 14px", borderRadius: 14, borderColor: handleErr ? "rgba(243,106,70,.5)" : "var(--line)" }}>
//             <span className="muted t14">@</span>
//             <input id="pe-handle" className="input" style={{ border: "none", background: "none" }} value={handle} maxLength={24}
//               onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))} />
//           </div>
//           {handleErr && <div className="coral t12" style={{ marginTop: 6 }}>{handleErr}</div>}
//         </Field>

//         <Field label="Gender" htmlFor="pe-gender">
//           <select id="pe-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
//             {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
//           </select>
//         </Field>

//         <Field label="Email" htmlFor="pe-email">
//           <input id="pe-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
//         </Field>

//         <Field label="Location" htmlFor="pe-location">
//           <input id="pe-location" className="input" value={location} maxLength={60} onChange={(e) => setLocation(e.target.value)} />
//         </Field>

//         <Field label="Interest" htmlFor="pe-interest">
//           <input id="pe-interest" className="input" value={interest} maxLength={80} placeholder="Music, photography, gaming…"
//             onChange={(e) => setInterest(e.target.value)} />
//         </Field>

//         <Field label="Bio" htmlFor="pe-bio">
//           <textarea id="pe-bio" className="input" rows={4} maxLength={280} placeholder="Tell fans a little about yourself"
//             value={bio} onChange={(e) => setBio(e.target.value)} style={{ resize: "none" }} />
//         </Field>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useQueryClient } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { useDebouncedCallback } from "use-debounce";
// import { useAppStore } from "@/lib/core";
// import { Avatar, Icon, Menu, Photo, SIZES, coverFor } from "@/lib/ui";
// import { useFetchProfile } from "@/hooks/apiHooks";
// import { showErrorToast } from "@/utils/toastUtils";
// import { isEmail } from "@/utils/helper";
// import { useAppSelector } from "@/services/hook";
// import { RootState } from "@/services/store";
// import { useCustomMutation } from "@/hooks/api/use-api";
// import { useFileUpload } from "@/hooks/api/use-file-upoad";

// const GENDERS = ["Prefer not to say", "Female", "Male", "Non-binary"];

// type FormValues = {
//   fullName: string;
//   displayName: string;
//   username: string;
//   email: string;
//   gender: string;
//   location: string;
//   interest: string;
//   bio: string;
//   residence: string;
//   profileImageUrl?: string;
//   coverImageUrl?: string;
// };

// function Field({
//   label,
//   htmlFor,
//   children,
// }: {
//   label: string;
//   htmlFor: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <label className="label" htmlFor={htmlFor}>
//         {label}
//       </label>
//       {children}
//     </div>
//   );
// }

// export default function EditProfilePage() {
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const S = useAppStore();
//   const { userObject } = useAppSelector((state: RootState) => state.auth);
//   const { data, isLoading } = useFetchProfile(userObject);
//   const profile = data?.data;

//   const {
//     register,
//     control,
//     getValues,
//     setValue,
//     watch,
//     reset,
//     setError,
//     clearErrors,
//     trigger,
//     formState: { errors, isDirty },
//   } = useForm<FormValues>({
//     defaultValues: {
//       fullName: "",
//       displayName: "",
//       username: "",
//       email: "",
//       gender: "",
//       location: "",
//       interest: "",
//       bio: "",
//       residence: "",
//       profileImageUrl: undefined,
//       coverImageUrl: undefined,
//     },
//   });

//   // Populate the form once the profile loads, same as old's reset(defaults).
//   useEffect(() => {
//     if (!profile) return;
//     reset({
//       fullName: profile.fullName || "",
//       displayName: profile.displayName || "",
//       username: profile.username || "",
//       email: profile.email || "",
//       gender: profile.gender || "",
//       location: profile.location || "",
//       interest: profile.interest || "",
//       bio: profile.bio || "",
//       residence: profile.residence || "",
//       profileImageUrl: profile.profileImageUrl,
//       coverImageUrl: profile.coverImageUrl,
//     });
//   }, [profile, reset]);

//   const avatarInput = useRef<HTMLInputElement>(null);
//   const coverInput = useRef<HTMLInputElement>(null);

//   const handle = watch("username");
//   const name = watch("displayName");
//   const avatarUrl = watch("profileImageUrl");
//   const coverUrl = watch("coverImageUrl");

//   const usernameIsEmail = isEmail(profile?.username);
//   const usernameReadOnly = Boolean(profile?.username) && !usernameIsEmail;

//   // --- Username uniqueness check, same debounce/behavior as before ---
//   const setUsernameMutation = useCustomMutation({
//     endpoint: `auth/set-username`,
//     successMessage: () => "Username set successfully",
//     onSuccessCallback: () => {
//       clearErrors("username");
//     },
//     onError: (error: any) => {
//       const status = error?.response?.status;
//       const message = error?.response?.data?.message;
//       if (status === 401) {
//         setError("username", {
//           type: "manual",
//           message: "Your session has expired. Please log in again.",
//         });
//         return;
//       }
//       setError("username", {
//         type: "manual",
//         message:
//           message || "We could not verify this username. Please try again.",
//       });
//     },
//   });

//   const handleUsernameBlur = useDebouncedCallback(() => {
//     const username = getValues("username");
//     const email = getValues("email");
//     if (username && username.trim() !== "" && username !== profile?.username) {
//       setUsernameMutation.mutate({ email, username });
//     } else if (username === profile?.username) {
//       clearErrors("username");
//     }
//   }, 500);

//   // --- Save ---
//   const updateProfileMutation = useCustomMutation({
//     endpoint: `profile/update-user`,
//     method: "put",
//     successMessage: () => "Profile updated successfully",
//     onSuccessCallback: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["viewProfile"],
//         exact: false,
//       });
//       reset(getValues());
//     },
//   });

//   const submitForm = async () => {
//     const isValid = await trigger();
//     if (!isValid) return;
//     updateProfileMutation.mutate(getValues());
//   };

//   // --- Image uploads ---
//   const { mutate: uploadProfilePicture, isPending: profilePictureIsPending } =
//     useFileUpload({
//       url: "/files/display-picture",
//       onSuccess: (res) => {
//         setValue("profileImageUrl", res?.body, { shouldDirty: true });
//         updateProfileMutation.mutate({
//           ...getValues(),
//           profileImageUrl: res?.body,
//         });
//         return res?.message || "File uploaded successfully!";
//       },
//       errorToast: (error: any) =>
//         error.response?.data?.message || "Upload failed",
//     });

//   const { mutate: uploadCoverPicture, isPending: coverPictureIsPending } =
//     useFileUpload({
//       onSuccess: (res) => {
//         setValue("coverImageUrl", res?.body?.url, { shouldDirty: true });
//         updateProfileMutation.mutate({
//           ...getValues(),
//           coverImageUrl: res?.body?.url,
//         });
//         return res?.message || "File uploaded successfully!";
//       },
//       errorToast: (error: any) =>
//         error.response?.data?.message || "Upload failed",
//     });

//   const isProfileComplete = Boolean(
//     getValues("fullName") &&
//     getValues("username") &&
//     getValues("gender") &&
//     getValues("location"),
//   );

//   const guardedUpload = (openPicker: () => void) => {
//     if (!isProfileComplete) {
//       showErrorToast(
//         "Please complete and save your profile information first.",
//       );
//       return;
//     }
//     if (isDirty) {
//       showErrorToast(
//         "Please save your profile changes before uploading images.",
//       );
//       return;
//     }
//     openPicker();
//   };

//   const pickImage = async (
//     e: React.ChangeEvent<HTMLInputElement>,
//     upload: (file: File) => void,
//   ) => {
//     const file = e.target.files?.[0];
//     e.target.value = "";
//     if (file) upload(file);
//   };

//   const saving =
//     updateProfileMutation.isPending ||
//     profilePictureIsPending ||
//     coverPictureIsPending ||
//     setUsernameMutation.isPending;

//   if (isLoading) {
//     return (
//       <div className="content row center" style={{ minHeight: 300 }}>
//         <span className="muted t14">Loading profile…</span>
//       </div>
//     );
//   }

//   return (
//     <div className="content" style={{ maxWidth: 680 }}>
//       <button
//         className="btn btn-ghost btn-sm"
//         style={{ marginBottom: 18 }}
//         onClick={() => navigate("/profile")}
//       >
//         <span className="row" style={{ transform: "rotate(180deg)" }}>
//           <Icon n="arrow" s={15} />
//         </span>
//         Back to profile
//       </button>

//       <input
//         ref={coverInput}
//         type="file"
//         accept="image/*"
//         hidden
//         onChange={(e) => pickImage(e, uploadCoverPicture)}
//       />
//       <input
//         ref={avatarInput}
//         type="file"
//         accept="image/*"
//         hidden
//         onChange={(e) => pickImage(e, uploadProfilePicture)}
//       />

//       <div
//         className="card"
//         style={{
//           padding: 0,
//           overflow: "visible",
//           marginTop: 14,
//           marginBottom: 56,
//         }}
//       >
//         <div
//           style={{
//             height: 140,
//             borderRadius: "var(--r) var(--r) 0 0",
//             overflow: "hidden",
//             position: "relative",
//             cursor: "pointer",
//           }}
//           onClick={() => guardedUpload(() => coverInput.current?.click())}
//         >
//           {coverUrl ? (
//             <img
//               src={coverUrl}
//               alt=""
//               style={{
//                 position: "absolute",
//                 inset: 0,
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "cover",
//               }}
//             />
//           ) : (
//             <Photo sizes={SIZES.cover} src={coverFor(handle)} seed={handle} />
//           )}
//           <div
//             className="row center gap6 onart"
//             style={{
//               position: "absolute",
//               right: 12,
//               bottom: 12,
//               padding: "6px 12px",
//               borderRadius: 999,
//             }}
//           >
//             <Icon n="camera" s={13} c="#fff" />
//             <span className="t12 b6" style={{ color: "#fff" }}>
//               Change cover
//             </span>
//           </div>
//         </div>

//         <div className="row center" style={{ marginTop: -48 }}>
//           <div
//             style={{ position: "relative", cursor: "pointer" }}
//             onClick={() => guardedUpload(() => avatarInput.current?.click())}
//           >
//             <div
//               style={{
//                 width: 96,
//                 height: 96,
//                 boxSizing: "border-box",
//                 border: "4px solid var(--card)",
//                 borderRadius: "50%",
//                 position: "relative",
//               }}
//             >
//               <Avatar name={name} size={88} src={avatarUrl} />
//             </div>
//             <div
//               className="row center"
//               style={{
//                 position: "absolute",
//                 right: -2,
//                 bottom: -2,
//                 width: 28,
//                 height: 28,
//                 borderRadius: "50%",
//                 background: "var(--blue)",
//                 border: "2px solid var(--card)",
//               }}
//             >
//               <Icon n="camera" s={13} c="#fff" />
//             </div>
//           </div>
//         </div>

//         <div
//           className="row gap10"
//           style={{ justifyContent: "flex-end", padding: "14px 18px 18px" }}
//         >
//           <button
//             className="btn btn-blue btn-sm"
//             disabled={saving}
//             onClick={submitForm}
//           >
//             {saving ? "Saving…" : "Save profile"}
//           </button>
//           <Menu
//             align="right"
//             trigger={
//               <button
//                 className="btn btn-ghost btn-sm"
//                 style={{ padding: "8px 10px" }}
//               >
//                 <Icon n="more" s={16} />
//               </button>
//             }
//             items={[
//               { ic: "logout", t: "Log out", fn: () => S.openModal("logout") },
//               {
//                 ic: "x",
//                 t: "Delete account",
//                 danger: true,
//                 fn: () =>
//                   S.toast(
//                     "Account deletion requires email confirmation — check your inbox",
//                     "err",
//                   ),
//               },
//             ]}
//           />
//         </div>
//       </div>

//       <div className="col gap16">
//         <Field label="Full name" htmlFor="pe-fullname">
//           <input
//             id="pe-fullname"
//             className="input"
//             maxLength={60}
//             style={{
//               borderColor: errors.fullName ? "rgba(243,106,70,.5)" : undefined,
//             }}
//             {...register("fullName", {
//               required: "Full name is required",
//               validate: (value) =>
//                 value.trim().split(/\s+/).length >= 2 ||
//                 "Please enter your first and last name",
//             })}
//           />
//           {errors.fullName && (
//             <div className="coral t12" style={{ marginTop: 6 }}>
//               {errors.fullName.message}
//             </div>
//           )}
//         </Field>

//         <Field label="Display name" htmlFor="pe-name">
//           <input
//             id="pe-name"
//             className="input"
//             maxLength={40}
//             {...register("displayName")}
//           />
//         </Field>

//         <Field label="Username" htmlFor="pe-handle">
//           <div
//             className="row hair"
//             style={{
//               padding: "0 14px",
//               borderRadius: 14,
//               borderColor: errors.username
//                 ? "rgba(243,106,70,.5)"
//                 : "var(--line)",
//             }}
//           >
//             <span className="muted t14">@</span>
//             <input
//               id="pe-handle"
//               className="input"
//               style={{ border: "none", background: "none" }}
//               maxLength={24}
//               readOnly={usernameReadOnly}
//               {...register("username", {
//                 required: "Username is required",
//                 onChange: (e) =>
//                   setValue("username", e.target.value.replace(/\s/g, "")),
//                 onBlur: handleUsernameBlur,
//               })}
//             />
//             {setUsernameMutation.isSuccess &&
//               !setUsernameMutation.isPending && (
//                 <Icon n="check" s={15} c="var(--mint-ink)" />
//               )}
//           </div>
//           {errors.username && (
//             <div className="coral t12" style={{ marginTop: 6 }}>
//               {errors.username.message}
//             </div>
//           )}
//         </Field>

//         <Field label="Gender" htmlFor="pe-gender">
//           <select
//             id="pe-gender"
//             className="input"
//             {...register("gender", { required: "Gender is required" })}
//           >
//             <option value="">Select…</option>
//             {GENDERS.map((g) => (
//               <option key={g} value={g}>
//                 {g}
//               </option>
//             ))}
//           </select>
//           {errors.gender && (
//             <div className="coral t12" style={{ marginTop: 6 }}>
//               {errors.gender.message}
//             </div>
//           )}
//         </Field>

//         <Field label="Email" htmlFor="pe-email">
//           <input
//             id="pe-email"
//             className="input"
//             type="email"
//             readOnly
//             {...register("email")}
//           />
//         </Field>

//         <Field label="Location" htmlFor="pe-location">
//           <input
//             id="pe-location"
//             className="input"
//             maxLength={60}
//             style={{
//               borderColor: errors.location ? "rgba(243,106,70,.5)" : undefined,
//             }}
//             {...register("location", { required: "Location is required" })}
//           />
//           {errors.location && (
//             <div className="coral t12" style={{ marginTop: 6 }}>
//               {errors.location.message}
//             </div>
//           )}
//         </Field>

//         <Field label="Interest" htmlFor="pe-interest">
//           <input
//             id="pe-interest"
//             className="input"
//             maxLength={80}
//             placeholder="Music, photography, gaming…"
//             {...register("interest")}
//           />
//         </Field>

//         <Field label="Bio" htmlFor="pe-bio">
//           <textarea
//             id="pe-bio"
//             className="input"
//             rows={4}
//             placeholder="Tell fans a little about yourself"
//             style={{
//               resize: "none",
//               borderColor: errors.bio ? "rgba(243,106,70,.5)" : undefined,
//             }}
//             {...register("bio", {
//               maxLength: {
//                 value: 255,
//                 message: "Bio must not exceed 255 characters",
//               },
//             })}
//           />
//           {errors.bio && (
//             <div className="coral t12" style={{ marginTop: 6 }}>
//               {errors.bio.message}
//             </div>
//           )}
//         </Field>

//         <Field label="Residence" htmlFor="pe-residence">
//           <input
//             id="pe-residence"
//             className="input"
//             {...register("residence")}
//           />
//         </Field>
//       </div>
//     </div>
//   );
// }

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { useAppStore } from "@/lib/core";
import { Avatar, Icon, Menu, Photo, SIZES, coverFor } from "@/lib/ui";
import { useFetchProfile } from "@/hooks/apiHooks";
import { showErrorToast } from "@/utils/toastUtils";
import { isEmail } from "@/utils/helper";
import { useAppSelector } from "@/services/hook";
import { RootState } from "@/services/store";
import { useCustomMutation } from "@/hooks/api/use-api";
import { useFileUpload } from "@/hooks/api/use-file-upoad";
import CustomFileUploader from "@/components/CustomFileUploader";

const GENDERS = ["Prefer not to say", "Female", "Male", "Non-binary"];

type FormValues = {
  fullName: string;
  displayName: string;
  username: string;
  email: string;
  gender: string;
  location: string;
  interest: string;
  bio: string;
  residence: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
};

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const S = useAppStore();
  const { userObject } = useAppSelector((state: RootState) => state.auth);
  const { data, isLoading } = useFetchProfile(userObject);
  const profile = data?.data;

  const {
    register,
    getValues,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: "",
      displayName: "",
      username: "",
      email: "",
      gender: "",
      location: "",
      interest: "",
      bio: "",
      residence: "",
      profileImageUrl: undefined,
      coverImageUrl: undefined,
    },
  });

  // Populate the form once the profile loads, same as old's reset(defaults).
  useEffect(() => {
    if (!profile) return;
    reset({
      fullName: profile.fullName || "",
      displayName: profile.displayName || "",
      username: profile.username || "",
      email: profile.email || "",
      gender: profile.gender || "",
      location: profile.location || "",
      interest: profile.interest || "",
      bio: profile.bio || "",
      residence: profile.residence || "",
      profileImageUrl: profile.profileImageUrl,
      coverImageUrl: profile.coverImageUrl,
    });
  }, [profile, reset]);

  const handle = watch("username");
  const name = watch("displayName");
  const avatarUrl = watch("profileImageUrl");
  const coverUrl = watch("coverImageUrl");

  const usernameIsEmail = isEmail(profile?.username);
  const usernameReadOnly = Boolean(profile?.username) && !usernameIsEmail;

  // --- Username uniqueness check ---
  const setUsernameMutation = useCustomMutation({
    endpoint: `auth/set-username`,
    successMessage: () => "Username set successfully",
    onSuccessCallback: () => {
      clearErrors("username");
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 401) {
        setError("username", {
          type: "manual",
          message: "Your session has expired. Please log in again.",
        });
        return;
      }
      setError("username", {
        type: "manual",
        message:
          message || "We could not verify this username. Please try again.",
      });
    },
  });

  const handleUsernameBlur = useDebouncedCallback(() => {
    const username = getValues("username");
    const email = getValues("email");
    if (username && username.trim() !== "" && username !== profile?.username) {
      setUsernameMutation.mutate({ email, username });
    } else if (username === profile?.username) {
      clearErrors("username");
    }
  }, 500);

  // --- Save ---
  const updateProfileMutation = useCustomMutation({
    endpoint: `profile/update-user`,
    method: "put",
    successMessage: () => "Profile updated successfully",
    onSuccessCallback: () => {
      queryClient.invalidateQueries({
        queryKey: ["viewProfile"],
        exact: false,
      });
      reset(getValues());
    },
  });

  const submitForm = async () => {
    const isValid = await trigger();
    if (!isValid) return;
    updateProfileMutation.mutate(getValues());
  };

  // --- Image uploads ---
  // Note: useFileUpload's mutate expects { file, extraData }, not a bare File.
  const { mutate: uploadProfilePicture, isPending: profilePictureIsPending } =
    useFileUpload({
      url: "/files/display-picture",
      onSuccess: (res) => {
        setValue("profileImageUrl", res?.body, { shouldDirty: true });
        updateProfileMutation.mutate({
          ...getValues(),
          profileImageUrl: res?.body,
        });
        return res?.message || "File uploaded successfully!";
      },
      errorToast: (error: any) =>
        error.response?.data?.message || "Upload failed",
    });

  const { mutate: uploadCoverPicture, isPending: coverPictureIsPending } =
    useFileUpload({
      onSuccess: (res) => {
        setValue("coverImageUrl", res?.body?.url, { shouldDirty: true });
        updateProfileMutation.mutate({
          ...getValues(),
          coverImageUrl: res?.body?.url,
        });
        return res?.message || "File uploaded successfully!";
      },
      errorToast: (error: any) =>
        error.response?.data?.message || "Upload failed",
    });

  const handleProfilePictureUpload = (file: File) => {
    uploadProfilePicture({ file, extraData: { usid: userObject?.usid } });
  };

  const handleCoverPictureUpload = (file: File) => {
    uploadCoverPicture({ file, extraData: { usid: userObject?.usid } });
  };

  const isProfileComplete = Boolean(
    getValues("fullName") &&
    getValues("username") &&
    getValues("gender") &&
    getValues("location"),
  );

  const guardedUpload = (openPicker: () => void) => {
    if (!isProfileComplete) {
      showErrorToast(
        "Please complete and save your profile information first.",
      );
      return;
    }
    if (isDirty) {
      showErrorToast(
        "Please save your profile changes before uploading images.",
      );
      return;
    }
    openPicker();
  };

  const saving =
    updateProfileMutation.isPending ||
    profilePictureIsPending ||
    coverPictureIsPending ||
    setUsernameMutation.isPending;

  if (isLoading) {
    return (
      <div className="content row center" style={{ minHeight: 300 }}>
        <span className="muted t14">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="content" style={{ maxWidth: 680 }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 18 }}
        onClick={() => navigate("/profile")}
      >
        <span className="row" style={{ transform: "rotate(180deg)" }}>
          <Icon n="arrow" s={15} />
        </span>
        Back to profile
      </button>

      <div
        className="card"
        style={{
          padding: 0,
          overflow: "visible",
          marginTop: 14,
          marginBottom: 56,
        }}
      >
        <div
          style={{
            height: 140,
            borderRadius: "var(--r) var(--r) 0 0",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Photo sizes={SIZES.cover} src={coverFor(handle)} seed={handle} />
          )}
          <div
            className="row center gap6 onart"
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              padding: "6px 12px",
              borderRadius: 999,
            }}
          >
            <Icon n="camera" s={13} c="#fff" />
            <span className="t12 b6" style={{ color: "#fff" }}>
              Change cover
            </span>
          </div>

          <CustomFileUploader
            maxSizeMB={5}
            acceptFormats={["png", "jpeg", "jpg", "gif", "svg"]}
            onFileUpload={handleCoverPictureUpload}
            showPreview={false}
            renderTrigger={(onClick) => (
              <div
                onClick={() => guardedUpload(onClick)}
                className="absolute inset-0"
                style={{ cursor: "pointer" }}
              />
            )}
          />
        </div>

        <div className="row center" style={{ marginTop: -48 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 96,
                height: 96,
                boxSizing: "border-box",
                border: "4px solid var(--card)",
                borderRadius: "50%",
                position: "relative",
              }}
            >
              <Avatar name={name} size={88} src={avatarUrl} />
            </div>
            <div
              className="row center"
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--blue)",
                border: "2px solid var(--card)",
              }}
            >
              <Icon n="camera" s={13} c="#fff" />
            </div>

            <CustomFileUploader
              maxSizeMB={1}
              acceptFormats={["png", "jpeg", "jpg", "gif", "svg"]}
              onFileUpload={handleProfilePictureUpload}
              showPreview={false}
              renderTrigger={(onClick) => (
                <div
                  onClick={() => guardedUpload(onClick)}
                  className="absolute inset-0"
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              )}
            />
          </div>
        </div>

        <div
          className="row gap10"
          style={{ justifyContent: "flex-end", padding: "14px 18px 18px" }}
        >
          <button
            className="btn btn-blue btn-sm"
            disabled={saving}
            onClick={submitForm}
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          <Menu
            align="right"
            trigger={
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: "8px 10px" }}
              >
                <Icon n="more" s={16} />
              </button>
            }
            items={[
              { ic: "logout", t: "Log out", fn: () => S.openModal("logout") },
              {
                ic: "x",
                t: "Delete account",
                danger: true,
                fn: () =>
                  S.toast(
                    "Account deletion requires email confirmation — check your inbox",
                    "err",
                  ),
              },
            ]}
          />
        </div>
      </div>

      <div className="col gap16">
        <Field label="Full name" htmlFor="pe-fullname">
          <input
            id="pe-fullname"
            className="input"
            maxLength={60}
            style={{
              borderColor: errors.fullName ? "rgba(243,106,70,.5)" : undefined,
            }}
            {...register("fullName", {
              required: "Full name is required",
              validate: (value) =>
                value.trim().split(/\s+/).length >= 2 ||
                "Please enter your first and last name",
            })}
          />
          {errors.fullName && (
            <div className="coral t12" style={{ marginTop: 6 }}>
              {errors.fullName.message}
            </div>
          )}
        </Field>

        <Field label="Display name" htmlFor="pe-name">
          <input
            id="pe-name"
            className="input"
            maxLength={40}
            {...register("displayName")}
          />
        </Field>

        <Field label="Username" htmlFor="pe-handle">
          <div
            className="row hair"
            style={{
              padding: "0 14px",
              borderRadius: 14,
              borderColor: errors.username
                ? "rgba(243,106,70,.5)"
                : "var(--line)",
            }}
          >
            <span className="muted t14">@</span>
            <input
              id="pe-handle"
              className="input"
              style={{ border: "none", background: "none" }}
              maxLength={24}
              readOnly={usernameReadOnly}
              {...register("username", {
                required: "Username is required",
                onChange: (e) =>
                  setValue("username", e.target.value.replace(/\s/g, "")),
                onBlur: handleUsernameBlur,
              })}
            />
            {setUsernameMutation.isSuccess &&
              !setUsernameMutation.isPending && (
                <Icon n="check" s={15} c="var(--mint-ink)" />
              )}
          </div>
          {errors.username && (
            <div className="coral t12" style={{ marginTop: 6 }}>
              {errors.username.message}
            </div>
          )}
        </Field>

        <Field label="Gender" htmlFor="pe-gender">
          <select
            id="pe-gender"
            className="input"
            {...register("gender", { required: "Gender is required" })}
          >
            <option value="">Select…</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.gender && (
            <div className="coral t12" style={{ marginTop: 6 }}>
              {errors.gender.message}
            </div>
          )}
        </Field>

        <Field label="Email" htmlFor="pe-email">
          <input
            id="pe-email"
            className="input"
            type="email"
            readOnly
            {...register("email")}
          />
        </Field>

        <Field label="Location" htmlFor="pe-location">
          <input
            id="pe-location"
            className="input"
            maxLength={60}
            style={{
              borderColor: errors.location ? "rgba(243,106,70,.5)" : undefined,
            }}
            {...register("location", { required: "Location is required" })}
          />
          {errors.location && (
            <div className="coral t12" style={{ marginTop: 6 }}>
              {errors.location.message}
            </div>
          )}
        </Field>

        <Field label="Interest" htmlFor="pe-interest">
          <input
            id="pe-interest"
            className="input"
            maxLength={80}
            placeholder="Music, photography, gaming…"
            {...register("interest")}
          />
        </Field>

        <Field label="Bio" htmlFor="pe-bio">
          <textarea
            id="pe-bio"
            className="input"
            rows={4}
            placeholder="Tell fans a little about yourself"
            style={{
              resize: "none",
              borderColor: errors.bio ? "rgba(243,106,70,.5)" : undefined,
            }}
            {...register("bio", {
              maxLength: {
                value: 255,
                message: "Bio must not exceed 255 characters",
              },
            })}
          />
          {errors.bio && (
            <div className="coral t12" style={{ marginTop: 6 }}>
              {errors.bio.message}
            </div>
          )}
        </Field>

        <Field label="Residence" htmlFor="pe-residence">
          <input
            id="pe-residence"
            className="input"
            {...register("residence")}
          />
        </Field>
      </div>
    </div>
  );
}
