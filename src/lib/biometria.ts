/**
 * Login rápido com biometria via Credential Management API.
 * Em celulares Android/iOS o navegador autentica via digital/Face ID antes
 * de preencher as credenciais salvas. Em desktop, apenas faz autofill.
 */

type StoredCred = { id: string; password: string };

function hasCredApi(): boolean {
  return typeof window !== "undefined"
    && "credentials" in navigator
    && typeof (window as unknown as { PasswordCredential?: unknown }).PasswordCredential !== "undefined";
}

export async function salvarCredencial(matricula: string, senha: string): Promise<boolean> {
  if (!hasCredApi()) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PC = (window as any).PasswordCredential;
    const cred = new PC({ id: matricula, password: senha, name: `Matrícula ${matricula}` });
    await navigator.credentials.store(cred);
    return true;
  } catch { return false; }
}

export async function buscarCredencial(mediation: CredentialMediationRequirement = "optional"): Promise<StoredCred | null> {
  if (!hasCredApi()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cred = await navigator.credentials.get({ password: true, mediation } as any);
    if (!cred) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = cred as any;
    if (c.type !== "password" || !c.id || !c.password) return null;
    return { id: c.id, password: c.password };
  } catch { return null; }
}

export function biometriaDisponivel(): boolean { return hasCredApi(); }
