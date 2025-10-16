import { useEffect, useRef, useState } from 'react';
import { enqueueForMatch, findMyActiveMatch } from '@/services/match';
import { subscribeMatchUpdates } from '@/services/realtime';
import type { UUID, Match, MatchStatus } from '@/types/db';

export function useQuickMatch(userId: UUID, opts: { gender?: string; want?: string; locale?: string; region?: string }) {
  const [phase, setPhase] = useState<'idle'|'queue'|'matched'|'connecting'|'connected'|'ended'>('idle');
  const [match, setMatch] = useState<Match | null>(null);
  const unsubRef = useRef<null | (()=>void)>(null);

  async function start() {
    setPhase('queue');
    await enqueueForMatch(userId, opts.gender ?? null, opts.want ?? 'any', opts.locale ?? null, opts.region ?? null, 0);
    const existing = await findMyActiveMatch(userId);
    if (existing) {
      wire(existing);
      return;
    }
    const t = setInterval(async () => {
      const m = await findMyActiveMatch(userId);
      if (m) {
        clearInterval(t);
        wire(m);
      }
    }, 2000);
  }

  function wire(m: Match) {
    setMatch(m);
    const s = (m.status as MatchStatus | undefined) ?? 'waiting';
    setPhase(s === 'matched' ? 'matched' : s === 'connected' ? 'connected' : 'queue');
    unsubRef.current?.();
    unsubRef.current = subscribeMatchUpdates(m.id, (nm: Partial<Match> & { status?: MatchStatus }) => {
      setMatch(nm as Match);
      if (nm.status === 'connected') setPhase('connected');
      if (nm.status === 'ended' || nm.status === 'cancelled') setPhase('ended');
    });
  }

  useEffect(() => () => { unsubRef.current?.(); }, []);
  return { phase, match, start };
}
