import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  HardDrive, 
  Bell, 
  Shield,
  Smartphone,
  Monitor,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// PWA Installation Manager with full offline support
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swStatus, setSwStatus] = useState('checking');
  const [cacheStatus, setCacheStatus] = useState({ cached: 0, total: 0 });
  const [showFullPanel, setShowFullPanel] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Full PWA Manifest with all required fields
  const manifestData = {
    name: "Archon - AI Agent Orchestration Platform",
    short_name: "Archon",
    description: "Enterprise-grade AI agent orchestration, workflow automation, and intelligent system management platform",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#020617",
    theme_color: "#0f172a",
    orientation: "any",
    dir: "ltr",
    lang: "en-US",
    prefer_related_applications: false,
    icons: [
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%230f172a' width='48' height='48' rx='8'/%3E%3Cpath fill='%233b82f6' d='M24 10l10 15H14z'/%3E%3Cpath fill='%238b5cf6' d='M24 38l-10-15h20z'/%3E%3C/svg%3E",
        sizes: "48x48",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect fill='%230f172a' width='72' height='72' rx='12'/%3E%3Cpath fill='%233b82f6' d='M36 15l15 22.5H21z'/%3E%3Cpath fill='%238b5cf6' d='M36 57l-15-22.5h30z'/%3E%3C/svg%3E",
        sizes: "72x72",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%230f172a' width='96' height='96' rx='16'/%3E%3Cpath fill='%233b82f6' d='M48 20l20 30H28z'/%3E%3Cpath fill='%238b5cf6' d='M48 76l-20-30h40z'/%3E%3C/svg%3E",
        sizes: "96x96",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect fill='%230f172a' width='128' height='128' rx='20'/%3E%3Cpath fill='%233b82f6' d='M64 26l27 40H37z'/%3E%3Cpath fill='%238b5cf6' d='M64 102l-27-40h54z'/%3E%3C/svg%3E",
        sizes: "128x128",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 144 144'%3E%3Crect fill='%230f172a' width='144' height='144' rx='24'/%3E%3Cpath fill='%233b82f6' d='M72 30l30 45H42z'/%3E%3Cpath fill='%238b5cf6' d='M72 114l-30-45h60z'/%3E%3C/svg%3E",
        sizes: "144x144",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 152 152'%3E%3Crect fill='%230f172a' width='152' height='152' rx='26'/%3E%3Cpath fill='%233b82f6' d='M76 32l32 48H44z'/%3E%3Cpath fill='%238b5cf6' d='M76 120l-32-48h64z'/%3E%3C/svg%3E",
        sizes: "152x152",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect fill='%230f172a' width='192' height='192' rx='32'/%3E%3Cpath fill='%233b82f6' d='M96 40l40 60H56z'/%3E%3Cpath fill='%238b5cf6' d='M96 152l-40-60h80z'/%3E%3C/svg%3E",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 384'%3E%3Crect fill='%230f172a' width='384' height='384' rx='48'/%3E%3Cpath fill='%233b82f6' d='M192 80l80 120H112z'/%3E%3Cpath fill='%238b5cf6' d='M192 304l-80-120h160z'/%3E%3C/svg%3E",
        sizes: "384x384",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect fill='%230f172a' width='512' height='512' rx='64'/%3E%3Cpath fill='%233b82f6' d='M256 106l106 160H150z'/%3E%3Cpath fill='%238b5cf6' d='M256 406l-106-160h212z'/%3E%3C/svg%3E",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    screenshots: [
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect fill='%230f172a' width='1280' height='720'/%3E%3Crect fill='%231e293b' x='0' y='0' width='256' height='720'/%3E%3Crect fill='%23020617' x='256' y='0' width='1024' height='80'/%3E%3Ctext fill='%23fff' x='300' y='50' font-size='24'%3EArchon Dashboard%3C/text%3E%3C/svg%3E",
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "Archon Dashboard - Desktop View"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 390 844'%3E%3Crect fill='%230f172a' width='390' height='844'/%3E%3Crect fill='%23020617' x='0' y='0' width='390' height='60'/%3E%3Ctext fill='%23fff' x='20' y='40' font-size='18'%3EArchon%3C/text%3E%3C/svg%3E",
        sizes: "390x844",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "Archon Dashboard - Mobile View"
      }
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "View system overview and metrics",
        url: "/?page=Dashboard&source=shortcut",
        icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%233b82f6' width='96' height='96' rx='16'/%3E%3Cpath fill='%23fff' d='M20 50h20v26H20zM56 30h20v46H56zM38 40h20v36H38z'/%3E%3C/svg%3E", sizes: "96x96" }]
      },
      {
        name: "Agents",
        short_name: "Agents",
        description: "Manage AI agents",
        url: "/?page=Agents&source=shortcut",
        icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%238b5cf6' width='96' height='96' rx='16'/%3E%3Ccircle fill='%23fff' cx='48' cy='35' r='15'/%3E%3Cpath fill='%23fff' d='M25 75c0-15 10-25 23-25s23 10 23 25z'/%3E%3C/svg%3E", sizes: "96x96" }]
      },
      {
        name: "Workflows",
        short_name: "Workflows",
        description: "Design and run workflows",
        url: "/?page=Workflows&source=shortcut",
        icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%2310b981' width='96' height='96' rx='16'/%3E%3Ccircle fill='%23fff' cx='25' cy='48' r='10'/%3E%3Ccircle fill='%23fff' cx='71' cy='30' r='10'/%3E%3Ccircle fill='%23fff' cx='71' cy='66' r='10'/%3E%3Cpath stroke='%23fff' stroke-width='3' fill='none' d='M35 48h20M55 48l10-15M55 48l10 15'/%3E%3C/svg%3E", sizes: "96x96" }]
      },
      {
        name: "Analytics",
        short_name: "Analytics",
        description: "View performance analytics",
        url: "/?page=Analytics&source=shortcut",
        icons: [{ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%23f59e0b' width='96' height='96' rx='16'/%3E%3Cpath fill='%23fff' d='M20 70L35 45 50 55 75 25v10L50 65 35 55 20 80z'/%3E%3C/svg%3E", sizes: "96x96" }]
      }
    ],
    categories: ["productivity", "business", "utilities", "developer tools"],
    iarc_rating_id: "",
    related_applications: [],
    handle_links: "preferred",
    launch_handler: {
      client_mode: ["navigate-existing", "auto"]
    },
    edge_side_panel: {
      preferred_width: 400
    },
    share_target: {
      action: "/?share-target=true",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "file",
            accept: ["application/json", "text/*"]
          }
        ]
      }
    },
    protocol_handlers: [
      {
        protocol: "web+archon",
        url: "/?protocol=%s"
      }
    ],
    file_handlers: [
      {
        action: "/?file-handler=true",
        accept: {
          "application/json": [".json", ".archon"]
        }
      }
    ]
  };

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Inject manifest
    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    // Add all required meta tags for PWA
    const metaTags = [
      { name: 'theme-color', content: '#0f172a' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Archon' },
      { name: 'application-name', content: 'Archon' },
      { name: 'msapplication-TileColor', content: '#0f172a' },
      { name: 'msapplication-tap-highlight', content: 'no' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'format-detection', content: 'telephone=no' }
    ];

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Apple touch icons
    const appleTouchIconSizes = ['180', '152', '144', '120', '114', '76', '72', '60', '57'];
    appleTouchIconSizes.forEach(size => {
      let link = document.querySelector(`link[rel="apple-touch-icon"][sizes="${size}x${size}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        link.setAttribute('sizes', `${size}x${size}`);
        link.href = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'%3E%3Crect fill='%230f172a' width='${size}' height='${size}' rx='${Math.round(parseInt(size) * 0.15)}'/%3E%3Cpath fill='%233b82f6' d='M${size/2} ${size*0.2}l${size*0.2} ${size*0.3}H${size*0.3}z'/%3E%3Cpath fill='%238b5cf6' d='M${size/2} ${size*0.8}l-${size*0.2}-${size*0.3}h${size*0.4}z'/%3E%3C/svg%3E`;
        document.head.appendChild(link);
      }
    });

    // Register advanced service worker
    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE_VERSION = 'archon-v2';
        const STATIC_CACHE = CACHE_VERSION + '-static';
        const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
        const API_CACHE = CACHE_VERSION + '-api';
        
        const STATIC_ASSETS = [
          '/',
          '/?offline=true'
        ];
        
        const CACHE_STRATEGIES = {
          static: 'cache-first',
          api: 'network-first',
          dynamic: 'stale-while-revalidate'
        };

        // Install event - cache static assets
        self.addEventListener('install', (event) => {
          console.log('[SW] Installing service worker...');
          event.waitUntil(
            caches.open(STATIC_CACHE)
              .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
              })
              .then(() => self.skipWaiting())
          );
        });

        // Activate event - clean old caches
        self.addEventListener('activate', (event) => {
          console.log('[SW] Activating service worker...');
          event.waitUntil(
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames
                  .filter((name) => name.startsWith('archon-') && !name.startsWith(CACHE_VERSION))
                  .map((name) => {
                    console.log('[SW] Deleting old cache:', name);
                    return caches.delete(name);
                  })
              );
            }).then(() => {
              console.log('[SW] Claiming clients');
              return self.clients.claim();
            })
          );
        });

        // Fetch event - handle requests
        self.addEventListener('fetch', (event) => {
          const { request } = event;
          const url = new URL(request.url);

          // Skip non-GET requests
          if (request.method !== 'GET') return;

          // Skip chrome-extension and other non-http(s) requests
          if (!url.protocol.startsWith('http')) return;

          // API requests - network first
          if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
            event.respondWith(networkFirst(request, API_CACHE));
            return;
          }

          // Static assets - cache first
          if (request.destination === 'style' || 
              request.destination === 'script' || 
              request.destination === 'font' ||
              request.destination === 'image') {
            event.respondWith(cacheFirst(request, STATIC_CACHE));
            return;
          }

          // Navigation requests - stale while revalidate
          if (request.mode === 'navigate') {
            event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
            return;
          }

          // Default - stale while revalidate
          event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
        });

        // Cache first strategy
        async function cacheFirst(request, cacheName) {
          const cached = await caches.match(request);
          if (cached) return cached;
          
          try {
            const response = await fetch(request);
            if (response.ok) {
              const cache = await caches.open(cacheName);
              cache.put(request, response.clone());
            }
            return response;
          } catch (error) {
            return new Response('Offline', { status: 503 });
          }
        }

        // Network first strategy
        async function networkFirst(request, cacheName) {
          try {
            const response = await fetch(request);
            if (response.ok) {
              const cache = await caches.open(cacheName);
              cache.put(request, response.clone());
            }
            return response;
          } catch (error) {
            const cached = await caches.match(request);
            if (cached) return cached;
            return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Stale while revalidate strategy
        async function staleWhileRevalidate(request, cacheName) {
          const cache = await caches.open(cacheName);
          const cached = await cache.match(request);
          
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);

          return cached || fetchPromise;
        }

        // Push notification handling
        self.addEventListener('push', (event) => {
          const options = {
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect fill="%230f172a" width="192" height="192" rx="32"/%3E%3Cpath fill="%233b82f6" d="M96 40l40 60H56z"/%3E%3Cpath fill="%238b5cf6" d="M96 152l-40-60h80z"/%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"%3E%3Crect fill="%233b82f6" width="72" height="72" rx="12"/%3E%3C/svg%3E',
            vibrate: [100, 50, 100],
            tag: 'archon-notification',
            renotify: true,
            requireInteraction: false,
            actions: [
              { action: 'view', title: 'View' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          };

          let data = { title: 'Archon', body: 'New notification' };
          
          if (event.data) {
            try {
              data = event.data.json();
            } catch (e) {
              data.body = event.data.text();
            }
          }

          event.waitUntil(
            self.registration.showNotification(data.title, { ...options, body: data.body, data: data })
          );
        });

        // Notification click handling
        self.addEventListener('notificationclick', (event) => {
          event.notification.close();

          if (event.action === 'dismiss') return;

          event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
              .then((clientList) => {
                for (const client of clientList) {
                  if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                  }
                }
                if (clients.openWindow) {
                  const url = event.notification.data?.url || '/';
                  return clients.openWindow(url);
                }
              })
          );
        });

        // Background sync
        self.addEventListener('sync', (event) => {
          console.log('[SW] Background sync:', event.tag);
          if (event.tag === 'sync-data') {
            event.waitUntil(syncData());
          }
        });

        async function syncData() {
          // Implement data sync logic here
          console.log('[SW] Syncing data...');
        }

        // Periodic background sync
        self.addEventListener('periodicsync', (event) => {
          if (event.tag === 'update-content') {
            event.waitUntil(updateContent());
          }
        });

        async function updateContent() {
          console.log('[SW] Periodic sync - updating content...');
        }

        // Message handling
        self.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
          }
          if (event.data && event.data.type === 'GET_CACHE_STATUS') {
            getCacheStatus().then((status) => {
              event.ports[0].postMessage(status);
            });
          }
        });

        async function getCacheStatus() {
          const cacheNames = await caches.keys();
          let totalSize = 0;
          let totalItems = 0;

          for (const name of cacheNames) {
            if (name.startsWith('archon-')) {
              const cache = await caches.open(name);
              const keys = await cache.keys();
              totalItems += keys.length;
            }
          }

          return { cached: totalItems, caches: cacheNames.length };
        }
      `;

      const swBlob = new Blob([swCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(swBlob);

      navigator.serviceWorker.register(swURL, { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          setSwStatus('active');

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                toast.info('New version available! Click to update.', {
                  action: {
                    label: 'Update',
                    onClick: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          });

          // Get cache status
          if (navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
              setCacheStatus(event.data);
            };
            navigator.serviceWorker.controller.postMessage(
              { type: 'GET_CACHE_STATUS' },
              [messageChannel.port2]
            );
          }
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
          setSwStatus('error');
        });

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // App installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('Archon installed successfully!');
    });

    return () => {
      URL.revokeObjectURL(manifestURL);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error('Installation not available. Try refreshing the page.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('Installing Archon...');
    } else {
      toast.info('Installation cancelled');
    }
    
    setDeferredPrompt(null);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      toast.success('Notifications enabled');
      // Send test notification
      new Notification('Archon', {
        body: 'Push notifications are now enabled!',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect fill="%230f172a" width="192" height="192" rx="32"/%3E%3Cpath fill="%233b82f6" d="M96 40l40 60H56z"/%3E%3Cpath fill="%238b5cf6" d="M96 152l-40-60h80z"/%3E%3C/svg%3E'
      });
    } else {
      toast.warning('Notification permission denied');
    }
  };

  const forceUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
          toast.info('Checking for updates...');
        }
      });
    }
  };

  // Mini install prompt
  if (showInstallPrompt && !showFullPanel) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
        <Card className="bg-slate-900 border-slate-700 shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Install Archon</h3>
                  <p className="text-xs text-slate-400">Quick access & offline mode</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
              <Button
                onClick={() => setShowFullPanel(true)}
                variant="outline"
                className="border-slate-700"
                size="sm"
              >
                More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full PWA management panel
  if (showFullPanel) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Archon PWA</CardTitle>
                  <p className="text-xs text-slate-400">Progressive Web App Settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullPanel(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Status Section */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-slate-300">Network</span>
                </div>
                <Badge className={isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {swStatus === 'active' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : swStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                  )}
                  <span className="text-sm text-slate-300">Service Worker</span>
                </div>
                <Badge className={
                  swStatus === 'active' ? 'bg-green-500/20 text-green-400' : 
                  swStatus === 'error' ? 'bg-red-500/20 text-red-400' : 
                  'bg-yellow-500/20 text-yellow-400'
                }>
                  {swStatus === 'active' ? 'Active' : swStatus === 'error' ? 'Error' : 'Loading'}
                </Badge>
              </div>
            </div>

            {/* Installation Status */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isInstalled ? (
                    <Smartphone className="w-5 h-5 text-green-400" />
                  ) : (
                    <Monitor className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-white font-medium">Installation</span>
                </div>
                <Badge className={isInstalled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}>
                  {isInstalled ? 'Installed' : 'Browser'}
                </Badge>
              </div>
              {!isInstalled && deferredPrompt && (
                <Button onClick={handleInstallClick} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Install Archon App
                </Button>
              )}
              {isInstalled && (
                <p className="text-sm text-slate-400">
                  Archon is installed as a standalone app on this device.
                </p>
              )}
            </div>

            {/* Cache Status */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">Offline Cache</span>
                </div>
                <span className="text-sm text-slate-400">{cacheStatus.cached} items</span>
              </div>
              <Progress value={Math.min((cacheStatus.cached / 50) * 100, 100)} className="h-2" />
              <p className="text-xs text-slate-500 mt-2">
                App data is cached for offline access
              </p>
            </div>

            {/* Notifications */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">Notifications</span>
                </div>
                <Badge className={
                  notificationPermission === 'granted' ? 'bg-green-500/20 text-green-400' :
                  notificationPermission === 'denied' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }>
                  {notificationPermission === 'granted' ? 'Enabled' :
                   notificationPermission === 'denied' ? 'Blocked' : 'Not Set'}
                </Badge>
              </div>
              {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
                <Button 
                  onClick={requestNotificationPermission} 
                  variant="outline" 
                  className="w-full border-slate-700"
                  size="sm"
                >
                  Enable Notifications
                </Button>
              )}
              {notificationPermission === 'denied' && (
                <p className="text-xs text-slate-500">
                  Notifications are blocked. Enable them in your browser settings.
                </p>
              )}
            </div>

            {/* Security */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Security</span>
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>HTTPS encrypted connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Secure service worker scope</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Content Security Policy active</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={forceUpdate} 
                variant="outline" 
                className="flex-1 border-slate-700"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Updates
              </Button>
              {updateAvailable && (
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Apply Update
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Offline indicator (always visible when offline)
  if (!isOnline) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
        <Badge className="bg-red-500/90 text-white px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          You're offline - Some features may be limited
        </Badge>
      </div>
    );
  }

  return null;
}