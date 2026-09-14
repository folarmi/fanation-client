export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  dob: string;
};

type RoleType = "CREATOR" | "VIEWER";

export type UserObject = {
  email: string;
  profileStatus: boolean;
  usid: string;
  enableLoginStatus: string;
  failedLoginAttempt: number;
  mfaEnabled: boolean;
  role: RoleType;
};
