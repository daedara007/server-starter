export default async function handler(req, res) {
  // 1. Cek Password dari Frontend
  const authHeader = req.headers['x-app-auth'];
  if (authHeader !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Panggil IDCloudHost
  const uuid = process.env.IDCLOUDHOST_VM_UUID;
  const apiKey = process.env.IDCLOUDHOST_API_KEY;

  try {
    const response = await fetch(`https://api.idcloudhost.com/v1/user-resource/vm?uuid=${uuid}`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengambil status' });
  }
}