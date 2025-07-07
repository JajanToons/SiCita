// public/sw.js

// PENTING: Baris ini adalah placeholder yang akan diisi oleh next-pwa/Workbox
// dengan daftar file yang akan di-precache. JANGAN DIHAPUS.
// eslint-disable-next-line no-restricted-globals, no-underscore-dangle
const ignored = self.__WB_MANIFEST; // Workbox akan mengganti ini dengan manifest sebenarnya

// --- Logika Kustom Anda untuk Push Notifications ---

// Event listener untuk ketika push message diterima
self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");

  // Default notifikasi
  let title = "Notifikasi Baru"; // Judul default yang lebih generik
  let options = {
    body: "Anda menerima pesan baru.", // Isi default
    icon: "/icons/icon-192x192.png", // Pastikan path ini benar
    badge: "/icons/badge-72x72.png", // Pastikan path ini benar (opsional)
    vibrate: [200, 100, 200],
    tag: "default-notification-tag", // Tag default
    renotify: true,
    data: {
      url: self.registration.scope, // URL default jika notifikasi diklik (scope SW, biasanya root PWA)
      // Anda bisa menambahkan properti default lain di 'data' jika perlu
    },
    // Tambahkan properti lain yang sering Anda gunakan dari payload JSON di sini sebagai fallback
    // image: undefined,
    // actions: [],
  };

  if (event.data) {
    const dataText = event.data.text(); // Ambil data sebagai teks sekali saja
    console.log(`[Service Worker] Push had this data: "${dataText}"`);

    try {
      const jsonData = JSON.parse(dataText); // Coba parse teks sebagai JSON

      // Jika berhasil, gunakan data dari JSON, dengan fallback ke default jika properti tidak ada
      title = jsonData.title || title;
      options.body = jsonData.body || options.body;
      options.icon = jsonData.icon || options.icon;
      options.badge = jsonData.badge || options.badge;
      options.vibrate = jsonData.vibrate || options.vibrate;
      options.tag = jsonData.tag || options.tag;
      // Untuk renotify, periksa apakah propertinya ada sebelum dioverride
      if (typeof jsonData.renotify !== "undefined") {
        options.renotify = jsonData.renotify;
      }

      // Simpan data tambahan dari payload untuk digunakan di 'notificationclick'
      // Pastikan ada fallback jika jsonData.data atau jsonData.data.url tidak ada
      options.data = {
        ...options.data, // Pertahankan default jika tidak dioverride
        ...(jsonData.data || {}), // Gabungkan dengan data dari JSON
        url: (jsonData.data && jsonData.data.url) || options.data.url, // Pastikan URL ada
      };

      // Override properti lain jika ada di JSON
      if (jsonData.image) options.image = jsonData.image;
      if (jsonData.actions) options.actions = jsonData.actions;
    } catch (e) {
      console.error(
        "[Service Worker] Error parsing push data (kemungkinan teks biasa):",
        e
      );
      // Jika parsing gagal, title sudah di-set ke "Notifikasi Baru"
      // dan options.body akan diisi dengan teks mentah.
      options.body = dataText;
      // options.data.url akan tetap menggunakan nilai default dari atas.
    }
  } else {
    console.log("[Service Worker] Push event tidak membawa data payload.");
    // Judul dan opsi akan menggunakan default yang sudah diatur di atas.
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Event listener untuk ketika notifikasi diklik oleh pengguna
self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click Received.");

  event.notification.close(); // Tutup notifikasi yang diklik

  // Dapatkan URL yang akan dibuka dari data notifikasi, atau gunakan URL default (scope service worker)
  const rawUrlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : self.registration.scope;

  // Normalisasi URL agar menjadi absolut relatif terhadap origin service worker
  const absoluteUrlToOpen = new URL(rawUrlToOpen, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true, // Penting untuk mencocokkan semua klien
      })
      .then(function (clientList) {
        // Cari tab yang sudah terbuka dengan URL yang sama
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // Bandingkan URL yang sudah dinormalisasi
          if (
            new URL(client.url, self.location.origin).href ===
              absoluteUrlToOpen &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        // Jika tidak ada tab yang cocok, buka jendela baru
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrlToOpen);
        }
      })
  );
});

// Opsional: Listener untuk push subscription change (jika endpoint berubah)
self.addEventListener("pushsubscriptionchange", function (event) {
  console.log("[Service Worker]: 'pushsubscriptionchange' event fired.");
  // TODO: Implementasikan logika untuk mengirim ulang event.newSubscription ke server aplikasi Anda
  // Contoh:
  // if (event.newSubscription) {
  //   sendSubscriptionToServer(event.newSubscription);
  // } else {
  //   // Langganan mungkin telah dibatalkan atau tidak valid
  //   handleSubscriptionLoss(event.oldSubscription);
  // }
  //
  // event.waitUntil(
  //   self.registration.pushManager.subscribe(event.oldSubscription.options)
  //   .then(subscription => {
  //     // Kirim subscription baru ke server aplikasi Anda
  //     // return fetch('/api/update-push-subscription', {
  //     //   method: 'POST',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify(subscription),
  //     // });
  //   })
  // );
});

// Anda TIDAK PERLU menambahkan event listener 'install' atau 'activate' di sini
// jika Anda tidak memiliki logika tambahan selain yang sudah ditangani Workbox.
// next-pwa akan secara otomatis memanggil skipWaiting() dan clientsClaim()
// berdasarkan konfigurasi di next.config.js Anda.
