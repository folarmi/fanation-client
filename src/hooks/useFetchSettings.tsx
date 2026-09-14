/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserObject } from "@/utils/types";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useCustomMutation } from "./api/use-api";

interface UseFetchSettingsOptions<TData = any> {
  endpoint: string;
  queryKeyPrefix: string;
  userObject?: UserObject;
  onSuccessCallback?: (data: TData) => void;
  enabled?: boolean;
  queryOptions?: Omit<
    UseQueryOptions<TData>,
    "queryKey" | "queryFn" | "enabled"
  >;
}

/**
 * Generic hook for fetching user settings via POST mutation wrapped in useQuery
 * @param options Configuration options for the fetch
 * @returns React Query result
 */
export const useFetchSettings = <TData = any,>({
  endpoint,
  queryKeyPrefix,
  userObject,
  onSuccessCallback = () => {},
  enabled = true,
  queryOptions = {},
}: UseFetchSettingsOptions<TData>) => {
  const mutation = useCustomMutation({
    endpoint,
    onSuccessCallback,
  });

  return useQuery<TData>({
    queryKey: [queryKeyPrefix, userObject?.email, userObject?.usid],
    queryFn: () =>
      mutation.mutateAsync({
        email: userObject?.email,
        role: userObject?.role,
        usid: userObject?.usid,
      }),
    enabled: enabled && !!userObject?.email,
    ...queryOptions,
  });
};
