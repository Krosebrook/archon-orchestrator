import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Inject manifest into document
    const manifestData = {
      name: "Archon - AI Orchestration Platform",
      short_name: "Archon",
      description: "Enterprise AI Agent Orchestration and Workflow Management",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      orientation: "portrait-primary",
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect fill='%230f172a' width='192' height='192'/%3E%3Cpath fill='%233b82f6' d='M96 40l40 60H56z'/%3E%3Cpath fill='%236366f1' d='M96 152l-40-60h80z'/%3E%3C/svg%3E",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect fill='%230f172a' width='512' height='512'/%3E%3Cpath fill='%233b82f6' d='M256 106l106 160H150z'/%3E%3Cpath fill='%236366f1' d='M256 406l-106-160h212z'/%3E%3C/svg%3E",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ],
      categories: ["productivity", "business", "utilities"]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    // Add theme-color meta tag
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = '#0f172a';

    // Register service worker with inline code
    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE_NAME = 'archon-v1';
        const urlsToCache = ['/'];

        self.addEventListener('install', (event) => {
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.addAll(urlsToCache))
          );
          self.skipWaiting();
        });

        self.addEventListener('activate', (event) => {
          event.waitUntil(
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => {
                  if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                  }
                })
              );
            })
          );
          self.clients.claim();
        });

        self.addEventListener('fetch', (event) => {
          if (event.request.method !== 'GET') return;
          
          event.respondWith(
            fetch(event.request)
              .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
                return response;
              })
              .catch(() => {
                return caches.match(event.request);
              })
          );
        });
      `;

      const swBlob = new Blob([swCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(swBlob);

      navigator.serviceWorker.register(swURL)
        .then(() => {
          console.log('Service Worker registered');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      URL.revokeObjectURL(manifestURL);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App installed successfully');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Install Archon</span>
          </div>
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-3">
          Install this app on your device for quick access and offline capability
        </p>
        <Button
          onClick={handleInstallClick}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Install App
        </Button>
      </div>
    </div>
  );
}