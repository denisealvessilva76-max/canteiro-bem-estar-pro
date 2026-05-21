// Fila de sincronização offline-first com IndexedDB
import { openDB, type IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

type PendingOp = {
  id?: number;
  table: string;
  payload: Record<string, unknown>;
  created_at: number;
};

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
  await db.add('queue', { table, payload, created_at: Date.now() } as PendingOp);
}

export async function pendingCount(): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  return db.count('queue');
}

export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  const db = await getDB();
  if (!db || typeof navigator === 'undefined' || !navigator.onLine) return { ok: 0, failed: 0 };
  const tx = db.transaction('queue', 'readwrite');
  const all = (await tx.store.getAll()) as PendingOp[];
  let ok = 0, failed = 0;
  for (const op of all) {
    try {
      const { error } = await supabase.from(op.table as never).insert(op.payload as never);
      if (error) throw error;
      if (op.id != null) await tx.store.delete(op.id);
      ok++;
    } catch {
      failed++;
    }
  }
  await tx.done;
  return { ok, failed };
}

/** Tenta inserir online; se falhar, enfileira offline. Retorna { online: bool }. */
export async function insertOrQueue(table: string, payload: Record<string, unknown>) {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const { error } = await supabase.from(table as never).insert(payload as never);
    if (!error) return { online: true as const, duplicate: false as const };
    if ((error as { code?: string } | null)?.code === '23505') {
      return { online: true as const, duplicate: true as const };
    }
  }
  await enqueue(table, payload);
  return { online: false as const, duplicate: false as const };
}

export function setupOnlineSync() {
  if (typeof window === 'undefined') return;
  const flush = () => { void flushQueue(); };
  window.addEventListener('online', flush);
  // tenta a cada 30s
  setInterval(flush, 30000);
  flush();
}
