// sw.js - Gelişmiş Versiyon
const CACHE_NAME = 'altin-butce-v4'; // Versiyonu değiştirdim ki tarayıcı yenilesin
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './js/app.js',     // Başlarına ./ koymak daha garanti
  './js/budget.js',
  './manifest.json',
  // Dış kütüphaneleri de ekleyelim ki internetsizken tasarım bozulmasın
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Dosyalar önbelleğe alınıyor...');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // ÖNEMLİ: Firebase ve API isteklerini Service Worker'a takılmadan direkt internete gönder
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis')) {
    return; // Bunlara karışma, Firebase kendi halletsin
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache'de varsa oradan ver, yoksa internetten çek
        return response || fetch(event.request);
      })
  );
});

// Eski versiyonları temizle (Kodunu güncellediğinde eskiler kalmasın)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});