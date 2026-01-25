<template>
  <div class="min-h-screen bg-zinc-900 text-slate-200 p-6">
    <nav class="flex justify-between items-center mb-10 border-b border-zinc-800 pb-4">
      <h1 class="text-xl font-bold text-sky-500">Lmao SMP Control Panel</h1>
      <button class="text-sm bg-red-900/30 text-red-400 px-3 py-1 rounded-md hover:bg-red-900/50 transition">Logout</button>
    </nav>

    <main class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <div class="bg-zinc-800 p-6 rounded-xl border border-zinc-700 shadow-xl">
        <h2 class="text-lg font-semibold mb-4 text-slate-400">Server Status</h2>
        <div class="flex items-center gap-4 mb-6">
          <div class="relative flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
          </div>
          <span class="text-2xl font-mono uppercase tracking-widest">Online</span>
        </div>
        
        <div class="flex gap-2">
          <button class="flex-1 bg-sky-600 hover:bg-sky-500 py-2 rounded-lg font-bold transition">START</button>
          <button class="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg font-bold transition">RESTART</button>
          <button class="bg-red-600 hover:bg-red-500 p-2 rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
        <h2 class="text-lg font-semibold mb-4 text-slate-400">Connection Info</h2>
        <div class="space-y-3 font-mono text-sm">
          <div class="flex justify-between border-b border-zinc-700 pb-2">
            <span class="text-zinc-500">IP Address:</span>
            <span>lmaosmp.ngrok.io</span>
          </div>
          <div class="flex justify-between border-b border-zinc-700 pb-2">
            <span class="text-zinc-500">Players:</span>
            <span>5 / 20</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Version:</span>
            <span>1.20.x (Bedrock)</span>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>