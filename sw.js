const CACHE_NAME = 'webmidi-switcher-v4';
const STATIC_CACHE = CACHE_NAME + '-static';
const DYNAMIC_CACHE = CACHE_NAME + '-dynamic';

// 開発モード検知（localhostや開発用ポート）
const isDev = () => {
    return self.location.hostname === 'localhost' || 
           self.location.hostname === '127.0.0.1' ||
           self.location.port === '8000' ||
           self.location.port === '3000' ||
           self.location.port === '5173';
};

// 静的リソース（外部CDN）
const staticResources = [
    'https://unpkg.com/vue@3/dist/vue.esm-browser.js',
    'https://unpkg.com/vue-i18n@11/dist/vue-i18n.esm-browser.js'
];

// ローカルファイル（常に最新を取得）
const dynamicResources = [
    '/',
    '/index.html',
    '/app.js',
    '/midi-manager.js',
    '/en.js',
    '/ja.js',
    '/manifest.json'
];

// インストール時
self.addEventListener('install', event => {
    console.log('Service Worker installing...', isDev() ? '[DEV MODE]' : '[PROD MODE]');
    
    if (isDev()) {
        // 開発モードでは即座にアクティベート
        self.skipWaiting();
        return;
    }

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static resources');
                return cache.addAll(staticResources);
            })
            .catch(error => {
                console.error('Static cache failed:', error);
            })
    );
});

// フェッチ処理
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 開発モードではキャッシュを無視
    if (isDev()) {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request))
        );
        return;
    }

    // 外部CDNリソースはキャッシュファースト
    if (url.origin !== self.location.origin) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // ローカルファイルはネットワークファースト
    event.respondWith(
        fetch(request)
            .then(response => {
                // ネットワーク成功時
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // ネットワーク失敗時はキャッシュから
                return caches.match(request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        // フォールバック
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        throw new Error('No cache available');
                    });
            })
    );
});

// メッセージ処理
self.addEventListener('message', event => {
    const { action } = event.data || {};
    
    switch (action) {
        case 'skipWaiting':
            console.log('Force update requested');
            self.skipWaiting();
            break;
            
        case 'clearCache':
            console.log('Clear cache requested');
            event.waitUntil(
                caches.keys()
                    .then(cacheNames => Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    ))
                    .then(() => {
                        // キャッシュクリア後、全クライアントに通知
                        return self.clients.matchAll();
                    })
                    .then(clients => {
                        clients.forEach(client => {
                            client.postMessage({ action: 'cacheCleared' });
                        });
                    })
            );
            break;
            
        case 'getInfo':
            // リクエストしたクライアントに情報を返信
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        action: 'info',
                        version: CACHE_NAME,
                        isDev: isDev()
                    });
                });
            });
            break;
    }
});

// アクティベート時の処理
self.addEventListener('activate', event => {
    console.log('Service Worker activating...', isDev() ? '[DEV MODE]' : '[PROD MODE]');
    
    event.waitUntil(
        Promise.all([
            // 古いキャッシュを削除
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!cacheName.startsWith(CACHE_NAME)) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // すべてのクライアントを制御下に置く
            self.clients.claim()
        ]).then(() => {
            // アクティベート完了後、全クライアントに通知
            return self.clients.matchAll();
        }).then(clients => {
            clients.forEach(client => {
                client.postMessage({ 
                    action: 'activated',
                    version: CACHE_NAME,
                    isDev: isDev()
                });
            });
        })
    );
});