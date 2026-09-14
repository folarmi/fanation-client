import api from "@/services/axios";
import { useQuery } from "@tanstack/react-query";

export type KycStatus =
  | "APPROVED"
  | "DECLINED"
  | "IN_REVIEW"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "AWAITING_USER"
  | "EXPIRED"
  | "KYC_EXPIRED"
  | "NOT_FINISHED"
  | "ABANDONED"
  | "RESUBMITTED";

export type KycSession = {
  id: number;
  email: string;
  sessionId: string;
  sessionNumber: string;
  sessionToken: string | null;
  url: string;
  status: KycStatus;
};

type UseKycSessionOptions = {
  email: string | undefined;
  enabled?: boolean;
};

export const useKycSession = ({
  email,
  enabled = true,
}: UseKycSessionOptions) => {
  return useQuery({
    queryKey: ["kycUserSessions", email],
    queryFn: async (): Promise<KycSession | null> => {
      const response = await api.get(
        `kyc/user-sessions?email=${encodeURIComponent(email!)}`,
      );
      const session: KycSession | null = response.data?.body ?? null;
      return session;
    },
    enabled: enabled && Boolean(email),
    // Don't refetch on window focus — status only changes via webhook,
    // not on every tab switch
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
};
