export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  dob: string;
};

type RoleType = "CREATOR" | "VIEWER";

export type FreeTrial = {
  name: string;
  limitSize: number;
  endDate: string;
  duration: number;
  publicId: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
};

export type SubscriptionBundle = {
  amount: string;
  durationInMonths: number;
  startDate: string;
  endDate: string;
  publicId: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
};

export interface BankingInfo {
  country: string;
  bankName: string;
  bankCode: string;
  accountNo: string;
  accountName: string;
}

export type PromotionCampaignQualifier =
  | "NEW_SUBSCRIBERS"
  | "EXPIRED_SUBSCRIBERS"
  | "BOTH";

export type PromotionCampaignType = "FREE_TRIAL" | "FIRST_MONTH_DISCOUNT";

export type PromotionalCampaignType = {
  publicId: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  name: string;
  limitSize: number;
  endDate: string;
  duration: number;
  message: string;
  qualifier: PromotionCampaignQualifier;
  type: PromotionCampaignType;
};

export interface CreatorProfile {
  monthlyFee: number;
  personaInquiryId: string;
  verified: boolean;
  creatorBankInfo: BankingInfo;
  subscriptions: any[];
  freeTrialLinks: FreeTrial[];
  subscriptionBundles: SubscriptionBundle[];
  promotionCampaigns: PromotionalCampaignType[];
}

export type UserObject = {
  email: string;
  profileStatus: boolean;
  usid: string;
  enableLoginStatus: string;
  failedLoginAttempt: number;
  mfaEnabled: boolean;
  role: RoleType;
};

export interface UserProfile {
  phoneNumber: string;
  usid: string;
  role: RoleType;
  email: string;
  residence: string;
  fullName: string;
  gender: string;
  location: string;
  profilePic: string | null;
  interest: string;
  bio: string;
  username: string;
  websiteUrl: string;
  displayName: string;
  coverImageUrl: string;
  profileImageUrl: string;
  creatorProfile: CreatorProfile | null;
}
