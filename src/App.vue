<script setup>
import { ref, reactive, onUnmounted } from 'vue';

// --- STATE LOGIN & UI ---
const isLoggedIn = ref(false);
const passwordInput = ref('');
const errorMsg = ref('');

// Loading states
const isLoggingIn = ref(false);
const isRefreshing = ref(false);
const isStarting = ref(false);

// --- DATA VPS ---
const vpsData = reactive({
  status: 'unknown',
  name: '',
  ip: ''
});

// --- DATA MINECRAFT ---
const mcServerData = ref(null);
const cacheAge = ref(0); 

let pollingInterval = null;

// --- LOGIC POLLING ---
const startPolling = () => {
  if (pollingInterval) return;
  pollingInterval = setInterval(() => {
    if (isLoggedIn.value) {
      // Saat polling, throwError = false (default)
      // Supaya kalau error koneksi sesaat, app tidak crash
      fetchStatus(false); 
      fetchMcStatus(); 
    }
  }, 5000);
};

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

// --- LOGIC LOGIN ---
const handleLogin = async () => {
  isLoggingIn.value = true;
  errorMsg.value = '';
  try {
    // FIX: Tambahkan parameter 'true' agar error dilempar jika password salah
    await fetchStatus(false, true);
    
    // Ambil data MC (ini boleh gagal kalau server mati, jadi tidak perlu throw)
    await fetchMcStatus();
    
    isLoggedIn.value = true;
    startPolling(); 
  } catch (err) {
    // Sekarang error akan tertangkap di sini!
    errorMsg.value = "Password salah atau koneksi gagal.";
    console.error("Login Failed:", err);
  } finally {
    isLoggingIn.value = false;
  }
};

// --- LOGIC API HELPER (VPS) ---
const callApi = async (endpoint, method = 'GET') => {
  const res = await fetch(`/api/${endpoint}`, {
    method: method,
    headers: { 'x-app-auth': passwordInput.value }
  });
  
  // Jika 401 (Unauthorized), ini akan melempar Error
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("API Error");
  return await res.json();
};

// --- FETCH STATUS VPS (MODIFIED) ---
// Parameter baru: throwError (default false)
const fetchStatus = async (useLoading = true, throwError = false) => {
  if (useLoading) isRefreshing.value = true;
  try {
    const data = await callApi('status');
    vpsData.status = data.status || 'unknown'; 
    vpsData.name = data.name || 'VPS IDCloudHost';
    if (data.public_ipv4) vpsData.ip = data.public_ipv4;
  } catch (e) {
    console.error("VPS Fetch Error:", e);
    
    // FIX UTAMA: Jika mode login (throwError=true), lempar error ke handleLogin
    if (throwError) throw e;
    
    // Jika sedang polling, biarkan silent error
  } finally {
    if (useLoading) isRefreshing.value = false;
  }
};

// --- FETCH MC STATUS ---
const fetchMcStatus = async () => {
  try {
    const res = await fetch('/api/check-mc');
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    
    mcServerData.value = {
      online: data.online,
      players: data.players,
      motd: { clean: [data.motd || ''] } 
    };
    cacheAge.value = 0;
  } catch (e) {
    console.error("MC Fetch Error:", e);
  }
};

// --- LOGIC START VPS ---
const startServer = async () => {
  if(!confirm("Yakin ingin menyalakan server?")) return;
  isStarting.value = true;
  vpsData.status = 'starting'; 

  try {
    // Saat start server, kita juga ingin tahu kalau password/token kadaluarsa
    // Jadi kita pakai callApi langsung yang akan throw error jika 401
    await callApi('start', 'POST');
  } catch (e) {
    alert("Gagal menyalakan server. Cek password atau koneksi.");
    vpsData.status = 'stopped'; 
  } finally {
    isStarting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
    
    <div v-if="!isLoggedIn" class="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      <h1 class="text-2xl font-bold mb-6 text-center text-blue-400">Control Panel Server MC</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-400">Password</label>
          <input 
            v-model="passwordInput" 
            type="password" 
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            placeholder="Silahkan masukkan password..."
          />
        </div>
        <div v-if="errorMsg" class="text-red-400 text-sm text-center">{{ errorMsg }}</div>
        <button 
          type="submit" 
          :disabled="isLoggingIn"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoggingIn ? 'Checking...' : 'Login' }}
        </button>
      </form>
    </div>

    <div v-else class="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      
      <div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div>
           <h2 class="text-xl font-bold text-white">Dashboard Minecraft</h2>
           <p class="text-xs text-gray-400">{{ vpsData.ip }} (Port: 19132)</p>
        </div>
        <button @click="isLoggedIn = false" class="text-xs text-red-400 hover:text-red-300 border border-red-900 px-3 py-1 rounded bg-red-900/20">Logout</button>
      </div>

      <div class="space-y-5">
        
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-700 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-2 opacity-10">
                <!-- <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2 1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg> -->
            </div>

            <div class="relative z-10">
                <h3 class="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Game Server Status</h3>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div :class="`w-3 h-3 rounded-full ${mcServerData?.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`"></div>
                        <span :class="`text-xl font-bold ${mcServerData?.online ? 'text-green-400' : 'text-red-400'}`">
                            {{ mcServerData?.online ? 'ONLINE' : 'OFFLINE' }}
                        </span>
                    </div>

                    <div class="text-right">
                        <p class="text-xs text-gray-500">Players</p>
                        <p class="text-2xl font-mono font-bold text-white">
                            {{ mcServerData?.players?.online || 0 }}<span class="text-gray-600 text-lg">/{{ mcServerData?.players?.max || 0 }}</span>
                        </p>
                    </div>
                </div>

                <div v-if="mcServerData?.online" class="mt-3 bg-gray-800 p-2 rounded text-xs font-mono text-yellow-100/80 truncate">
                    {{ mcServerData?.motd?.clean?.[0] || 'No MOTD' }}
                </div>
            </div>
        </div>

        <hr class="border-gray-700/50" />

        <div class="bg-gray-700/30 p-4 rounded-lg flex items-center justify-between border border-gray-700/50">
          <div>
            <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Status Mesin (VPS)</p>
            <div class="flex items-center gap-2 mt-1">
              <span 
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-green-500': vpsData.status === 'running',
                  'bg-red-500': vpsData.status === 'stopped',
                  'bg-yellow-500': vpsData.status !== 'running' && vpsData.status !== 'stopped'
                }"
              ></span>
              <p class="text-sm font-mono font-bold capitalize text-gray-200">{{ vpsData.status }}</p>
            </div>
          </div>
          
          <button 
            @click="fetchStatus(true)" 
            :disabled="isRefreshing"
            class="p-2 hover:bg-gray-600 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Refresh Status VPS">
              <svg :class="{'animate-spin': isRefreshing}" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        <button 
          @click="startServer"
          :disabled="isStarting || isRefreshing || vpsData.status === 'running' || vpsData.status === 'stopping'"
          class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          :class="(vpsData.status === 'running' || vpsData.status === 'stopping')
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
            : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white ring-2 ring-blue-500/20'"
        >
          <span v-if="isStarting" class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Processing...
          </span>
          <span v-else-if="vpsData.status === 'running'">Mesin Sudah Jalan ✅</span>
          <span v-else-if="vpsData.status === 'stopping'">Mesin Sedang Stopping... 🛑</span>
          <span v-else>Nyalakan Server 🔥🔥</span>
        </button>
        
        <p v-if="vpsData.status === 'running' && !mcServerData?.online" class="text-center text-xs text-yellow-500 animate-pulse">
          VPS menyala, menunggu Minecraft Server loading atau sedang dalam mode shutdown...
        </p>

      </div>
    </div>
  </div>
</template>