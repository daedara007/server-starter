<script setup>
import { ref, reactive } from 'vue';

// State yang sudah DIPISAH agar tidak bentrok
const isLoggedIn = ref(false);
const passwordInput = ref('');
const errorMsg = ref('');

// Loading states terpisah
const isLoggingIn = ref(false);  // Loading saat login
const isRefreshing = ref(false); // Loading saat refresh status
const isStarting = ref(false);   // Loading saat menyalakan server

// Data VPS
const vpsData = reactive({
  status: 'unknown',
  name: '',
  ip: ''
});

// --- Logic Login ---
const handleLogin = async () => {
  isLoggingIn.value = true; // Pakai isLoggingIn
  errorMsg.value = '';
  
  try {
    // Kita panggil fetchStatus tapi jangan trigger isRefreshing (silent check)
    await fetchStatus(false); 
    isLoggedIn.value = true;
  } catch (err) {
    errorMsg.value = "Password salah atau koneksi gagal.";
  } finally {
    isLoggingIn.value = false;
  }
};

// --- Logic API Helper ---
const callApi = async (endpoint, method = 'GET') => {
  const res = await fetch(`/api/${endpoint}`, {
    method: method,
    headers: {
      'x-app-auth': passwordInput.value
    }
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("API Error");
  return await res.json();
};

// --- Logic Refresh Status ---
// Parameter useLoading: true jika diklik tombol refresh, false jika dipanggil saat login
const fetchStatus = async (useLoading = true) => {
  if (useLoading) isRefreshing.value = true; // Pakai isRefreshing
  
  try {
    const data = await callApi('status');
    vpsData.status = data.status || 'unknown'; 
    vpsData.name = data.name || 'VPS IDCloudHost';
    vpsData.ip = data.private_ipv4 || data.public_ipv4 || '-'; 
  } catch (e) {
    console.error(e);
    if(isLoggedIn.value && useLoading) alert("Gagal refresh status");
    throw e;
  } finally {
    if (useLoading) isRefreshing.value = false;
  }
};

// --- Logic Start Server ---
const startServer = async () => {
  if(!confirm("Yakin ingin menyalakan server?")) return;
  
  isStarting.value = true; // Pakai isStarting
  try {
    await callApi('start', 'POST');
    alert("Perintah start dikirim! Tunggu sebentar lalu refresh.");
    // Auto refresh setelah 5 detik
    setTimeout(() => fetchStatus(true), 5000);
  } catch (e) {
    alert("Gagal menyalakan server.");
  } finally {
    isStarting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
    
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
      <div class="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h2 class="text-xl font-bold text-white">Dashboard Server Minecraft</h2>
        <button @click="isLoggedIn = false" class="text-xs text-gray-400 hover:text-white">Logout</button>
      </div>

      <div class="space-y-6">
        <div class="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Status Server</p>
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
            @click="fetchStatus(true)" 
            :disabled="isRefreshing"
            class="p-2 hover:bg-gray-600 rounded-full transition-colors"
            title="Refresh Status">
              <span v-if="isRefreshing" class="block animate-spin">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </span>
              <span v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </span>
          </button>
        </div>

        <button 
          @click="startServer"
          :disabled="isStarting || isRefreshing || vpsData.status === 'running' || vpsData.status === 'stopping'"
          class="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
          :class="(vpsData.status === 'running' || vpsData.status === 'stopping')
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500 text-white'"
        >
          <span v-if="isStarting">Processing...</span>
          <span v-else-if="vpsData.status === 'running'">Server Sudah Jalan ✅</span>
          <span v-else-if="vpsData.status === 'stopping'">Sedang Stopping... 🛑</span>
          <span v-else>Nyalakan Server 🔥🔥</span>
        </button>
      </div>
    </div>

  </div>
</template>