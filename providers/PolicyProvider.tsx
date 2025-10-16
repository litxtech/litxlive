import { useEffect, useMemo, useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';

export interface PolicyLink { slug: string; title: string }
export interface PolicyItem {
  id: string;
  base_slug: string | null;
  slug: string;
  locale: string;
  category: string | null;
  title: string;
  body_md: string;
  status: 'draft'|'published'|'archived';
  version: number;
  show_on_login: boolean;
  required_ack: boolean;
  show_in_app: boolean;
  show_in_footer: boolean;
  sort_order: number;
}

export const [PolicyProvider, usePolicies] = createContextHook(() => {
  const { currentLanguage } = useLanguage();

  const listQuery = trpc.policies.listPublic.useQuery({ locale: currentLanguage }, { staleTime: 60_000 });
  const footerQuery = trpc.policies.listFooter.useQuery({ locale: currentLanguage }, { staleTime: 60_000 });
  const pendingQuery = trpc.policies.pendingForUser.useQuery({ locale: currentLanguage }, { staleTime: 5_000, retry: false });

  const acknowledgeMutation = trpc.policies.acknowledge.useMutation();

  const acknowledge = useCallback(async (policyId: string, version: number) => {
    await acknowledgeMutation.mutateAsync({ policyId, version });
    await pendingQuery.refetch();
  }, [acknowledgeMutation, pendingQuery]);

  return useMemo(() => ({
    policies: (listQuery.data ?? []) as PolicyItem[],
    footerPolicies: (footerQuery.data ?? []) as PolicyLink[],
    pending: (pendingQuery.data ?? []) as PolicyItem[],
    isLoading: listQuery.isLoading || footerQuery.isLoading || pendingQuery.isLoading,
    error: listQuery.error || footerQuery.error || pendingQuery.error,
    acknowledge,
  }), [listQuery.data, footerQuery.data, pendingQuery.data, listQuery.isLoading, footerQuery.isLoading, pendingQuery.isLoading, listQuery.error, footerQuery.error, pendingQuery.error, acknowledge]);
});
