// Service worker minimo: nessuna cache, solo per soddisfare i criteri di installabilità PWA.
// I dati della dashboard devono sempre arrivare freschi dal server.
self.addEventListener("fetch", () => {});
