# @autokpo/app

## 0.2.2

### Patch Changes

- [#60](https://github.com/balakin/autokpo/pull/60) [`bdb1177`](https://github.com/balakin/autokpo/commit/bdb1177b87e4f1ec0d5dc720083794ef16971d65) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added /pull and /push named routes to the sync API, keeping old root routes as deprecated aliases

- [#60](https://github.com/balakin/autokpo/pull/60) [`b247028`](https://github.com/balakin/autokpo/commit/b24702870c45ffeaf076ab8cebee1f7c06de606f) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Moved sync cursor to ?since= param and signaling to JSON bodies, added Cache-Control: no-store

## 0.2.1

### Patch Changes

- [#58](https://github.com/balakin/autokpo/pull/58) [`1165b2c`](https://github.com/balakin/autokpo/commit/1165b2caaf5490be5598f9d2b72174137f31883f) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Fix sync write loop caused by push racing with pull's IDB writes

## 0.2.0

### Minor Changes

- [#32](https://github.com/balakin/autokpo/pull/32) [`9e0597b`](https://github.com/balakin/autokpo/commit/9e0597b988ebffebf588a4bd75b904de7db5f5d8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Unified sidebar colors and removed dedicated sidebar tokens

- [#32](https://github.com/balakin/autokpo/pull/32) [`9e0597b`](https://github.com/balakin/autokpo/commit/9e0597b988ebffebf588a4bd75b904de7db5f5d8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Switched settings to HeroUI Tabs and removed draft warning from book page

- [#18](https://github.com/balakin/autokpo/pull/18) [`6eb1ae6`](https://github.com/balakin/autokpo/commit/6eb1ae692655f0b2c1fbbee2e4f9335565d8deb8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added master password change flow

- [#32](https://github.com/balakin/autokpo/pull/32) [`9e0597b`](https://github.com/balakin/autokpo/commit/9e0597b988ebffebf588a4bd75b904de7db5f5d8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Fixed mobile layout with sticky top bar and safe-area-aware drawers

- [#10](https://github.com/balakin/autokpo/pull/10) [`e872355`](https://github.com/balakin/autokpo/commit/e8723551d94076fb7d6ea8b10f56721e16947990) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Gated /avatars/:id behind auth with ownership check and cleared SW cache on logout

- [#45](https://github.com/balakin/autokpo/pull/45) [`97acfbd`](https://github.com/balakin/autokpo/commit/97acfbde16f34e1b4a2b3cb72dfa6bd3808a2313) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Renamed the auth session cookie to autokpo_session

- [#14](https://github.com/balakin/autokpo/pull/14) [`ae9ee34`](https://github.com/balakin/autokpo/commit/ae9ee340f9eb7f72c0ff4a673dd14a82a27bf57b) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Replaced inline language and theme selects in the auth header with a gear button that opens a responsive preferences panel

- [#53](https://github.com/balakin/autokpo/pull/53) [`fd96c2e`](https://github.com/balakin/autokpo/commit/fd96c2e4e4a716fc917d89efe46cb2f1f24b96b4) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added robots.txt to the app disallowing all search engine crawlers

- [#32](https://github.com/balakin/autokpo/pull/32) [`9e0597b`](https://github.com/balakin/autokpo/commit/9e0597b988ebffebf588a4bd75b904de7db5f5d8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added drawer slide animations

- [#17](https://github.com/balakin/autokpo/pull/17) [`13af9da`](https://github.com/balakin/autokpo/commit/13af9da5706bb53b3b7a2a7c3dfbda3301544dc2) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added pin unlock for local session

- [#8](https://github.com/balakin/autokpo/pull/8) [`17d33ec`](https://github.com/balakin/autokpo/commit/17d33ecdb234f97a489cb9056192fda3d4f13d46) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added help page

- [#11](https://github.com/balakin/autokpo/pull/11) [`60b56ec`](https://github.com/balakin/autokpo/commit/60b56eca5136176cc0cbc5e9dea52b6d695fa5cd) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added end-to-end encryption with Argon2id and AES-256-GCM

- [#45](https://github.com/balakin/autokpo/pull/45) [`97acfbd`](https://github.com/balakin/autokpo/commit/97acfbde16f34e1b4a2b3cb72dfa6bd3808a2313) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Moved auth sessions from Cloudflare KV to D1-backed storage and removed the AUTH_KV binding

- [#22](https://github.com/balakin/autokpo/pull/22) [`6fee00b`](https://github.com/balakin/autokpo/commit/6fee00b963f43014ff7d617baf823d5126938415) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added key rotation with DEK rotation on compaction and key ring update

- [#26](https://github.com/balakin/autokpo/pull/26) [`7faec8a`](https://github.com/balakin/autokpo/commit/7faec8ab87173871f8379480cde943c3c8a8eeb9) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Hardened auth surface against abuse through payload limits, rate limiting, endpoint reduction, and data minimization.

- [#44](https://github.com/balakin/autokpo/pull/44) [`62f7ae3`](https://github.com/balakin/autokpo/commit/62f7ae37e48dee531da57650d4d64804d8e2f1b8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added Terms, Privacy, and Cookies links to sign-in notice, app shell footers, and Help page.

- [#27](https://github.com/balakin/autokpo/pull/27) [`bb12de2`](https://github.com/balakin/autokpo/commit/bb12de2d257bf9e0c0d3837582675c94c16d7b5d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added Cloudflare Workers rate limiting to sync, E2EE, and exchange-rate API routes with per-user, per-route-group keys.

- [#32](https://github.com/balakin/autokpo/pull/32) [`9e0597b`](https://github.com/balakin/autokpo/commit/9e0597b988ebffebf588a4bd75b904de7db5f5d8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Removed entry count from book library cards

- [#23](https://github.com/balakin/autokpo/pull/23) [`cf36d11`](https://github.com/balakin/autokpo/commit/cf36d1171aa628e043721424340b5cdf17a71500) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Removed avatar uploads, simplified profile section to use identicon-based avatars only

- [#13](https://github.com/balakin/autokpo/pull/13) [`d1f682c`](https://github.com/balakin/autokpo/commit/d1f682c75aa3261ff971f9afb7c555a26ffa05a0) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added local device key that auto-unlocks encryption on subsequent sessions after first password unlock

- [#33](https://github.com/balakin/autokpo/pull/33) [`791e65a`](https://github.com/balakin/autokpo/commit/791e65ac7213f118589655be0593392cf4bf2909) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Replaced Workbox NetworkFirst runtime caches for session and key-ring with React Query IDB persistence via PersistQueryClientProvider

- [#28](https://github.com/balakin/autokpo/pull/28) [`456dd84`](https://github.com/balakin/autokpo/commit/456dd84aed7e98dd012b06bb36673538ad2e8b2c) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Replaced IndexedDB offline caches with service-worker runtime caches and simplified cross-tab auth sync.

- [#16](https://github.com/balakin/autokpo/pull/16) [`4077f9c`](https://github.com/balakin/autokpo/commit/4077f9c4ac30b2ca68c3afd53911fa1c6d92aec0) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added encrypted local persistence with dedicated DEK, row-identity AAD binding, and atomic key rotation

- [#36](https://github.com/balakin/autokpo/pull/36) [`33cb0ea`](https://github.com/balakin/autokpo/commit/33cb0ea3a906637e2038a0cf8a365f12876c9da8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Changed app icon

- [#29](https://github.com/balakin/autokpo/pull/29) [`8aadd2b`](https://github.com/balakin/autokpo/commit/8aadd2bf5965b4a20e9fc7ac466eebd8a8460958) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Moved session storage from D1 to Cloudflare KV

- [#45](https://github.com/balakin/autokpo/pull/45) [`97acfbd`](https://github.com/balakin/autokpo/commit/97acfbde16f34e1b4a2b3cb72dfa6bd3808a2313) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Removed cookie policy

- [#45](https://github.com/balakin/autokpo/pull/45) [`97acfbd`](https://github.com/balakin/autokpo/commit/97acfbde16f34e1b4a2b3cb72dfa6bd3808a2313) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added user ID and session metadata to account exports

- [#25](https://github.com/balakin/autokpo/pull/25) [`71ab915`](https://github.com/balakin/autokpo/commit/71ab915b3c4104a029118beca02e7c59c020ad36) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Hardened payload size limits for sync and E2EE endpoints with shared constants, body limits, base64 checks, and database constraints.

- [#27](https://github.com/balakin/autokpo/pull/27) [`bb12de2`](https://github.com/balakin/autokpo/commit/bb12de2d257bf9e0c0d3837582675c94c16d7b5d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Replaced Better Auth's built-in rate limiter on auth endpoints with a Cloudflare Workers rate limiter keyed by IP and path.

- [#32](https://github.com/balakin/autokpo/pull/32) [`9e0597b`](https://github.com/balakin/autokpo/commit/9e0597b988ebffebf588a4bd75b904de7db5f5d8) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Made dashboard grids and preview detail grids responsive

- [#24](https://github.com/balakin/autokpo/pull/24) [`5e2d6ab`](https://github.com/balakin/autokpo/commit/5e2d6abdf8fa7d634135ba7e7386277df378a071) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Simplified snapshot pull logic and decoupled CRDT runtime from sync encryption keys

- [#12](https://github.com/balakin/autokpo/pull/12) [`7ebd117`](https://github.com/balakin/autokpo/commit/7ebd11794a929c016566acc403f343204d99ccf9) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Replaced single master key with a key ring model that decouples the data encryption key from the master encryption key

- [#49](https://github.com/balakin/autokpo/pull/49) [`8341a28`](https://github.com/balakin/autokpo/commit/8341a287ae50a76ad5cb07b870cffe2844780579) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added support email

### Patch Changes

- [#51](https://github.com/balakin/autokpo/pull/51) [`0b76cbf`](https://github.com/balakin/autokpo/commit/0b76cbf3325c9613545d846edbba9e469d017d2d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Fixed theme change behavior on ios 26

- [#56](https://github.com/balakin/autokpo/pull/56) [`86833d0`](https://github.com/balakin/autokpo/commit/86833d0f4ecf48b92e3798c873a0b30bbe77c846) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Reduced Worker cold start time from ~227 ms to ~99 ms by lazy loading react-email

- [#15](https://github.com/balakin/autokpo/pull/15) [`2a4855d`](https://github.com/balakin/autokpo/commit/2a4855d44510d880f51b59de6f664ab44725567b) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Made income chart Y-axis ticks adapt to data magnitude

## 0.1.0

### Minor Changes

- [#3](https://github.com/balakin/autokpo/pull/3) [`e2d4c4b`](https://github.com/balakin/autokpo/commit/e2d4c4bbbc3336caf7592d30287d61087ba1a54d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Initial release
