import { useQuery } from "@tanstack/react-query";

import { lookupsApi } from "../api/resources";

// Справочники грузятся один раз и кэшируются надолго (меняются редко).
// Месяцы справочником не являются — их имена резолвятся из lib/months.
const LONG_STALE = 1000 * 60 * 60;

export function useSecurityTypes() {
  return useQuery({
    queryKey: ["security-types"],
    queryFn: lookupsApi.securityTypes,
    staleTime: LONG_STALE,
  });
}

export function useAssetTypes() {
  return useQuery({
    queryKey: ["asset-types"],
    queryFn: lookupsApi.assetTypes,
    staleTime: LONG_STALE,
  });
}
