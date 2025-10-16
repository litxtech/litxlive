import { q } from './db';

export async function audit(actor: string, action: string, entityType?: string, entityId?: string, diff?: unknown, ip?: string, ua?: string) {
  try {
    await q(
      `INSERT INTO audit_logs(actor_user_id, action, entity_type, entity_id, diff, ip, ua)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [actor, action, entityType ?? null, entityId ?? null, diff ?? null, ip ?? null, ua ?? null]
    );
  } catch (e) {
    console.error('[audit] failed', e);
  }
}
