const CACHE_NAME = "shift-game-v1"
const STATIC_CACHE = "shift-static-v1"
const DYNAMIC_CACHE = "shift-dynamic-v1"

// Static assets to cache immediately
const STATIC_ASSETS = ["/", "/offline", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
    console.log("[ServiceWorker] Install")
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                console.log("[ServiceWorker] Caching static assets")
                return cache.addAll(STATIC_ASSETS)
            })
            .then(() => self.skipWaiting())
    )
})

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
    console.log("[ServiceWorker] Activate")
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log("[ServiceWorker] Removing old cache:", name)
                            return caches.delete(name)
                        })
                )
            })
            .then(() => self.clients.claim())
    )
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== "GET") return

    // Skip socket.io requests
    if (url.pathname.includes("socket.io")) return

    // Skip API requests (handle differently)
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(networkFirst(request))
        return
    }

    // For navigation requests, use network first
    if (request.mode === "navigate") {
        event.respondWith(
            networkFirst(request).catch(() => {
                return caches.match("/offline")
            })
        )
        return
    }

    // For static assets, use cache first
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request))
        return
    }

    // Default: network first
    event.respondWith(networkFirst(request))
})

// Cache first strategy
async function cacheFirst(request) {
    const cached = await caches.match(request)
    if (cached) {
        return cached
    }
    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE)
            cache.put(request, response.clone())
        }
        return response
    } catch (error) {
        console.log("[ServiceWorker] Fetch failed:", error)
        throw error
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE)
            cache.put(request, response.clone())
        }
        return response
    } catch (error) {
        const cached = await caches.match(request)
        if (cached) {
            return cached
        }
        throw error
    }
}

// Check if request is for static asset
function isStaticAsset(pathname) {
    const staticExtensions = [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf"]
    return staticExtensions.some((ext) => pathname.endsWith(ext))
}

// Push notification handling
self.addEventListener("push", (event) => {
    console.log("[ServiceWorker] Push received")

    let data = { title: "SHIFT", body: "Nouvelle notification" }

    if (event.data) {
        try {
            data = event.data.json()
        } catch (e) {
            data.body = event.data.text()
        }
    }

    const options = {
        body: data.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        vibrate: [100, 50, 100],
        data: {
            url: data.url || "/",
            dateOfArrival: Date.now(),
        },
        actions: data.actions || [
            { action: "open", title: "Ouvrir" },
            { action: "close", title: "Fermer" },
        ],
        tag: data.tag || "shift-notification",
        renotify: true,
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click handling
self.addEventListener("notificationclick", (event) => {
    console.log("[ServiceWorker] Notification clicked")

    event.notification.close()

    if (event.action === "close") {
        return
    }

    const urlToOpen = event.notification.data?.url || "/"

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(urlToOpen)
                    return client.focus()
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
        })
    )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
    console.log("[ServiceWorker] Sync event:", event.tag)

    if (event.tag === "sync-game-state") {
        event.waitUntil(syncGameState())
    }
})

async function syncGameState() {
    // Get pending actions from IndexedDB and sync with server
    console.log("[ServiceWorker] Syncing game state...")
    // Implementation would require IndexedDB access
}

// Message handling from main thread
self.addEventListener("message", (event) => {
    console.log("[ServiceWorker] Message received:", event.data)

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting()
    }
})
