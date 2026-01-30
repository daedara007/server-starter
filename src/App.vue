<script setup>
import { ref, reactive } from 'vue';

// State
const isLoggedIn = ref(false);
const passwordInput = ref('');
const errorMsg = ref('');
const loading = ref(false);

// Data VPS
const vpsData = reactive({
  status: 'unknown', // stopped, running, etc.
  name: '',
  ip: ''
});

// --- Logic Login ---
const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  
  // Kita coba fetch status untuk memvalidasi password
  try {
    await fetchStatus(passwordInput.value);
    // Jika fetch sukses (tidak 401), berarti login benar
    isLoggedIn.value = true;
  } catch (err) {
    errorMsg.value = "Password salah atau koneksi gagal.";
  } finally {
    loading.value = false;
  }
};

// --- Logic API ---
// Fungsi helper untuk fetch ke Vercel API
const callApi = async (endpoint, method = 'GET') => {
  const res = await fetch(`/api/${endpoint}`, {
    method: method,
    headers: {
      'x-app-auth': passwordInput.value // Kirim password sebagai auth header
    }
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("API Error");
  return await res.json();
};

const fetchStatus = async (pwd = passwordInput.value) => {
  // Jika dipanggil dari tombol refresh
  if(isLoggedIn.value) loading.value = true;
  
  try {
    const data = await callApi('status');
    // Sesuaikan mapping data dengan response JSON IDCloudHost
    // Biasanya ada di data.result atau data root
    vpsData.status = data.status || 'unknown'; 
    vpsData.name = data.name || 'VPS IDCloudHost';
    // Mapping IP jika ada di response structure
    vpsData.ip = data.private_ipv4 || data.public_ipv4 || '-'; 
  } catch (e) {
    console.error(e);
    if(isLoggedIn.value) alert("Gagal refresh status");
    throw e; // Lempar error agar ditangkap login handler
  } finally {
    loading.value = false;
  }
};

const startServer = async () => {
  if(!confirm("Yakin ingin menyalakan server?")) return;
  
  loading.value = true;
  try {
    await callApi('start', 'POST');
    alert("Perintah start dikirim! Tunggu sebentar lalu refresh.");
    // Auto refresh setelah 5 detik
    setTimeout(() => fetchStatus(), 5000);
  } catch (e) {
    alert("Gagal menyalakan server.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
    
    <div v-if="!isLoggedIn" class="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      <h1 class="text-2xl font-bold mb-6 text-center text-blue-400">Server Control Access</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-400">Access Key</label>
          <input 
            v-model="passwordInput" 
            type="password" 
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            placeholder="Enter password..."
          />
        </div>
        
        <div v-if="errorMsg" class="text-red-400 text-sm text-center">{{ errorMsg }}</div>
        
        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Checking...' : 'Enter Control Panel' }}
        </button>
      </form>
    </div>

    <div v-else class="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      <div class="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h2 class="text-xl font-bold text-white">VPS Dashboard</h2>
        <button @click="isLoggedIn = false" class="text-xs text-gray-400 hover:text-white">Logout</button>
      </div>

      <div class="space-y-6">
        <div class="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Server Status</p>
            <div class="flex items-center gap-2 mt-1">
              <span 
                class="w-3 h-3 rounded-full animate-pulse"
                :class="{
                  'bg-green-500': vpsData.status === 'running',
                  'bg-red-500': vpsData.status === 'stopped',
                  'bg-yellow-500': vpsData.status !== 'running' && vpsData.status !== 'stopped'
                }"
              ></span>
              <p class="text-lg font-mono font-bold capitalize">{{ vpsData.status }}</p>
            </div>
          </div>
          <button 
            @click="fetchStatus()" 
            :disabled="loading"
            class="p-2 hover:bg-gray-600 rounded-full transition-colors"
            title="Refresh Status"
          >
            🔄
          </button>
        </div>

        <div class="text-sm text-gray-400 font-mono bg-black/30 p-3 rounded">
          <p>Name : {{ vpsData.name }}</p>
          <p>IP   : {{ vpsData.ip }}</p>
        </div>

        <button 
          @click="startServer"
          :disabled="loading || vpsData.status === 'running'"
          class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
          :class="vpsData.status === 'running' 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500 text-white'"
        >
          <span v-if="loading">Processing...</span>
          <span v-else>🚀 Start Server</span>
        </button>
      </div>
    </div>

  </div>
</template>