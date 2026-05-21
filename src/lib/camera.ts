// Helpers de captura "anti-expertinho": força câmera nativa e coleta GPS+timestamp.
export type CapturaMeta = {
  gps_lat: number | null;
  gps_lng: number | null;
  gps_capturado_em: string;
};

export async function obterGPS(timeoutMs = 6000): Promise<{ lat: number | null; lng: number | null }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return { lat: null, lng: null };
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve({ lat: null, lng: null }), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(to); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { clearTimeout(to); resolve({ lat: null, lng: null }); },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}

export async function capturarMeta(): Promise<CapturaMeta> {
  const g = await obterGPS();
  return { gps_lat: g.lat, gps_lng: g.lng, gps_capturado_em: new Date().toISOString() };
}
