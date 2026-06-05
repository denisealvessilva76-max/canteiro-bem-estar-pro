// Fila de sincronização offline-first com IndexedDB
import { openDB, type IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

type PendingOp = {
  id?: number;
  table: string;
  payload: Record<string, unknown>;
  created_at: number;
  attempts?: number;
  last_error?: string;
};

const MAX_ATTEMPTS = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB('canteiro-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueue(table: string, payload: Record<string, unknown>) {
  const db = await getDB();
  if (!db) return;
  await db.add('queue', { table, payload, created_at: Date.now(), attempts: 0 } as PendingOp);
}

export async function pendingCount(): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  return db.count('queue');
}

export async function clearQueue(): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  const n = await db.count('queue');
  await db.clear('queue');
  return n;
}

export async function flushQueue(): Promise<{ ok: number; failed: number; discarded: number }> {
  const db = await getDB();
  if (!db || typeof navigator === 'undefined' || !navigator.onLine) return { ok: 0, failed: 0, discarded: 0 };
  const all = (await db.getAll('queue')) as PendingOp[];
  let ok = 0, failed = 0, discarded = 0;
  for (const op of all) {
    if (op.id == null) continue;
    try {
      const { error } = await supabase.from(op.table as never).insert(op.payload as never);
      if (error) throw error;
      await db.delete('queue', op.id);
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const attempts = (op.attempts ?? 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await db.delete('queue', op.id);
        discarded++;
      } else {
        await db.put('queue', { ...op, attempts, last_error: msg });
        failed++;
      }
    }
  }
  return { ok, failed, discarded };
}

/** Tenta inserir online; se falhar, enfileira offline. Retorna { online: bool }. */
export async function insertOrQueue(table: string, payload: Record<string, unknown>) {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const { error } = await supabase.from(table as never).insert(payload as never);
    if (!error) return { online: true as const, duplicate: false as const, error: null };
    if ((error as { code?: string } | null)?.code === '23505') {
      return { online: true as const, duplicate: true as const, error: null };
    }
    return { online: true as const, duplicate: false as const, error: error.message ?? 'erro' };
  }
  await enqueue(table, payload);
  return { online: false as const, duplicate: false as const, error: null };
}

export function setupOnlineSync() {
  if (typeof window === 'undefined') return;
  const flush = () => { void flushQueue(); };
  window.addEventListener('online', flush);
  setInterval(flush, 30000);
  flush();
}
