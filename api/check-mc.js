export default async function handler(request, response) {
  // IP VPS kamu (Hardcode saja karena ini khusus servermu)
  const VPS_API_URL = 'http://157.10.252.9:5000/status';

  try {
    // Fetch ke Python API di VPS
    const res = await fetch(VPS_API_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Set timeout agar Vercel tidak hang jika VPS mati
      signal: AbortSignal.timeout(3000) 
    });

    if (!res.ok) throw new Error('VPS API Error');

    const data = await res.json();
    
    // Kirim data persis seperti yang Vue harapkan
    return response.status(200).json(data);

  } catch (error) {
    // Jika VPS mati atau API Python belum jalan
    return response.status(200).json({
      online: false,
      players: { online: 0, max: 0 },
      error: "Gagal connect ke API Python VPS"
    });
  }
}