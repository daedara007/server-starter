export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 1. Cek Password
  const authHeader = req.headers['x-app-auth'];
  if (authHeader !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Panggil IDCloudHost
  const uuid = process.env.IDCLOUDHOST_VM_UUID;
  const apiKey = process.env.IDCLOUDHOST_API_KEY;

  try {
    // Format body x-www-form-urlencoded sesuai contoh curl curl -d
    const body = new URLSearchParams();
    body.append('uuid', uuid);

    const response = await fetch(`https://api.idcloudhost.com/v1/user-resource/vm/start`, {
      method: 'POST',
      headers: { 'apikey': apiKey },
      body: body
    });
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal menyalakan server' });
  }
}