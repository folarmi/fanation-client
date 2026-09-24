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

export interface CreatorUser {
  publicId: string;
  role: RoleType;
  fullName: string;
  gender: string;
  location: string;
  profileImageUrl: string;
  coverImageUrl: string;
  interest: string;
  bio: string;
  username: string;
  websiteUrl: string;
  displayName: string;
  email: string;
  creatorProfile: CreatorProfile;
}

export interface ReactionCount {
  LIKE: number;
  LOVE: number;
  DISLIKE: number;
  LOL: number;
}

export interface PostCreator {
  email: string;
  name: string;
  profilePic: string;
  username: string;
}

export interface PollChoice {
  choice: string;
  publicId: string;
  votes?: string[];
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface PollDuration {
  days: number;
  hours: number;
  minutes: number;
}

export interface BookMark {
  email: string;
  name: string;
  profilePic: string;
  username: string;
}

export type MediaType = "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
export type ReactionType = "LIKE" | "LOVE" | "DISLIKE" | "LOL";
export interface IsReactionLiked {
  isLiked: boolean;
}
export interface MediaFile {
  publicId: string;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  mediaType: MediaType;
  mediaLink: string;
}
export interface Reaction {
  publicId: string;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  type: ReactionType;
}

export interface ReactionItem {
  type: string;
  number: number;
  createdBy: string[]; // was this already an array? make sure it is
}

// Live Reactions
export interface LiveReaction {
  id: string | number;
  session: string;
  reactionType: ReactionType;
  user?: string;
  userId?: string;
  username?: string;
  timestamp?: number;
}

export interface LiveReactionPayload {
  session: string;
  reactionType: ReactionType;
}

// ✅ Floating reaction for animation
export interface FloatingReaction {
  id: string;
  type: ReactionType;
  x: number; // Random horizontal position
  y: number; // Starting vertical position
}

// ✅ Reaction count for display
export interface ReactionCount {
  LIKE: number;
  LOVE: number;
  DISLIKE: number;
  LOL: number;
}

export interface PostCreator {
  email: string;
  name: string;
  profilePic: string;
  username: string;
}

export interface PollChoice {
  choice: string;
  publicId: string;
  votes?: string[];
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface PollDuration {
  days: number;
  hours: number;
  minutes: number;
}

export interface BookMark {
  email: string;
  name: string;
  profilePic: string;
  username: string;
}

export interface StoryPost {
  publicId: string;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  creator: PostCreator;
  message: string;
  mediaFiles: MediaFile[];
  comments: PostComment[];
  reactions: Reaction[];
  viewers: string[];
  mentions: string[];
  reposters: { email: string }[];
  bookmarkers: BookMark[];
  pollChoices?: PollChoice[];
  pollDuration?: PollDuration;
  meta: PostMeta;
  replies: StoryPost[];
  content?: any;
}

export interface PostComment {
  publicId: string;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  message: string;
  replies: PostComment[];
  reactions: Reaction[];
}

export interface PostMeta {
  reactionCount: number;
  commentCount: number;
  viewCount: number;
}

export interface SortInfo {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface StoryPost {
  publicId: string;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  creator: PostCreator;
  message: string;
  mediaFiles: MediaFile[];
  comments: PostComment[];
  reactions: Reaction[];
  viewers: string[];
  mentions: string[];
  reposters: { email: string }[];
  bookmarkers: BookMark[];
  pollChoices?: PollChoice[];
  pollDuration?: PollDuration;
  meta: PostMeta;
  replies: StoryPost[];
  content?: any;
}
