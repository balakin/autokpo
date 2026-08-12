# @autokpo/website

## 0.5.7

### Patch Changes

- [#148](https://github.com/balakin/autokpo/pull/148) [`185e591`](https://github.com/balakin/autokpo/commit/185e591d676e5d17a13dca222de9a9bcefe71462) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Updated dependencies

## 0.5.6

### Patch Changes

- [#114](https://github.com/balakin/autokpo/pull/114) [`9b8f2fe`](https://github.com/balakin/autokpo/commit/9b8f2fe1d5f1450efa6612ad7361f5d40c3a7434) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Updated astro to v7

## 0.5.5

### Patch Changes

- [#112](https://github.com/balakin/autokpo/pull/112) [`786114c`](https://github.com/balakin/autokpo/commit/786114cb33e973242301a2dbba88fecb9b8c4c1d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Updated dependencies

## 0.5.4

### Patch Changes

- [#102](https://github.com/balakin/autokpo/pull/102) [`35500b8`](https://github.com/balakin/autokpo/commit/35500b8b26dd9a279b747b2b13aeca0da6b72c80) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Unified AutoKPO product copy across website, app metadata, PWA manifest, and Help page

## 0.5.3

### Patch Changes

- [#100](https://github.com/balakin/autokpo/pull/100) [`ace3410`](https://github.com/balakin/autokpo/commit/ace3410804a8e62f1d8ff678f39e5aeb3b57c21f) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Updated dependencies

## 0.5.2

### Patch Changes

- [#89](https://github.com/balakin/autokpo/pull/89) [`ba4777a`](https://github.com/balakin/autokpo/commit/ba4777a29ad33e45ad5f2b1389de5bf7c095cb33) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Renamed GitHub deploy environments to Application and Website

## 0.5.1

### Patch Changes

- [#87](https://github.com/balakin/autokpo/pull/87) [`c8b863d`](https://github.com/balakin/autokpo/commit/c8b863da20a205a1e1c635ddddc6a6e4b4972d12) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Fixed broken Web Vitals capture in slim PostHog bundle by adding AnalyticsExtensions and web-vitals imports

- [#87](https://github.com/balakin/autokpo/pull/87) [`cd7c330`](https://github.com/balakin/autokpo/commit/cd7c330c70a2718e36e7e9c82112cf6706c82997) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Updated legal doc links to reflect new locale routing where / is English and /sr-latn is Serbian

## 0.5.0

### Minor Changes

- [#84](https://github.com/balakin/autokpo/pull/84) [`158d02a`](https://github.com/balakin/autokpo/commit/158d02a69fa4e4604ef07fd92fe3166d269ed6d3) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added ?lang= query parameter so website passes locale to app on navigation

- [#84](https://github.com/balakin/autokpo/pull/84) [`158d02a`](https://github.com/balakin/autokpo/commit/158d02a69fa4e4604ef07fd92fe3166d269ed6d3) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Changed default locale from sr-Latn to en across website and app

### Patch Changes

- [#86](https://github.com/balakin/autokpo/pull/86) [`9f602e8`](https://github.com/balakin/autokpo/commit/9f602e815adae30ad9c3a567b0c8c8fb7b34e192) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Updated session cookie name to \_\_Secure-autokpo_session in privacy policy across all locales.

## 0.4.1

### Patch Changes

- [#82](https://github.com/balakin/autokpo/pull/82) [`ec89734`](https://github.com/balakin/autokpo/commit/ec89734472851fc943e2dffa8beda8b36bab872b) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added a Cloudflare management comment to the website robots.txt.

## 0.4.0

### Minor Changes

- [#80](https://github.com/balakin/autokpo/pull/80) [`247c8a2`](https://github.com/balakin/autokpo/commit/247c8a2fc306de6cb48dcc41db812131fc6fa1d2) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added Open Graph social sharing tags, SEO meta descriptions, and noindex robots directives to the app and website

## 0.3.3

### Patch Changes

- [#78](https://github.com/balakin/autokpo/pull/78) [`c197754`](https://github.com/balakin/autokpo/commit/c19775460cf2bb4c2eda29e1374672d85daa4168) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added a per-build version meta tag so each deploy produces distinct HTML

## 0.3.2

### Patch Changes

- [#76](https://github.com/balakin/autokpo/pull/76) [`86d5f3f`](https://github.com/balakin/autokpo/commit/86d5f3f3d648489263d378e57e9b6c6e9a80d635) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Removed inline style attribute violating website CSP

- [#76](https://github.com/balakin/autokpo/pull/76) [`86d5f3f`](https://github.com/balakin/autokpo/commit/86d5f3f3d648489263d378e57e9b6c6e9a80d635) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Removed CSP violation reporting to PostHog

## 0.3.1

### Patch Changes

- [#67](https://github.com/balakin/autokpo/pull/67) [`878d51c`](https://github.com/balakin/autokpo/commit/878d51c83696fd12125da99a173fef0b0dac3e7c) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added Content Security Policy headers with PostHog reporting

## 0.3.0

### Minor Changes

- [#64](https://github.com/balakin/autokpo/pull/64) [`a98e98e`](https://github.com/balakin/autokpo/commit/a98e98e91c1d8efc495d718903c9ac98b132b643) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Hardened the existing PostHog config, tagged events by release version, and disclosed app analytics in the privacy policy

## 0.2.0

### Minor Changes

- [#62](https://github.com/balakin/autokpo/pull/62) [`c581798`](https://github.com/balakin/autokpo/commit/c581798b66bdb835e260c4849fb25c7d004e2864) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added privacy-friendly PostHog analytics to the website, with consent-free configuration and disclosure in the privacy policy

## 0.1.0

### Minor Changes

- [#51](https://github.com/balakin/autokpo/pull/51) [`0b76cbf`](https://github.com/balakin/autokpo/commit/0b76cbf3325c9613545d846edbba9e469d017d2d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added 404 page

- [#45](https://github.com/balakin/autokpo/pull/45) [`97acfbd`](https://github.com/balakin/autokpo/commit/97acfbde16f34e1b4a2b3cb72dfa6bd3808a2313) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added privacy policy

- [#55](https://github.com/balakin/autokpo/pull/55) [`49aeed4`](https://github.com/balakin/autokpo/commit/49aeed41136a17f91fa3c491d4ab948be2955722) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added Cloudflare Turnstile Privacy Addendum references to all privacy policy locales

- [#40](https://github.com/balakin/autokpo/pull/40) [`d121438`](https://github.com/balakin/autokpo/commit/d121438504a75acb781f2f178f01bc3a3e0775d9) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Localized website

- [#39](https://github.com/balakin/autokpo/pull/39) [`4324f18`](https://github.com/balakin/autokpo/commit/4324f18d48feb104d3102aca11673683585210a5) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added the public AutoKPO landing page

- [#48](https://github.com/balakin/autokpo/pull/48) [`46dfc4c`](https://github.com/balakin/autokpo/commit/46dfc4ca51a30c8bde4361d9de890000d2614262) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added Terms of Service and updated legal document dates

- [#45](https://github.com/balakin/autokpo/pull/45) [`97acfbd`](https://github.com/balakin/autokpo/commit/97acfbde16f34e1b4a2b3cb72dfa6bd3808a2313) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Removed cookie policy

- [#52](https://github.com/balakin/autokpo/pull/52) [`ccac634`](https://github.com/balakin/autokpo/commit/ccac6347683c5804eaafb9002b9897fade0aedc4) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added sitemap

- [#49](https://github.com/balakin/autokpo/pull/49) [`8341a28`](https://github.com/balakin/autokpo/commit/8341a287ae50a76ad5cb07b870cffe2844780579) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Added support email

### Patch Changes

- [#51](https://github.com/balakin/autokpo/pull/51) [`0b76cbf`](https://github.com/balakin/autokpo/commit/0b76cbf3325c9613545d846edbba9e469d017d2d) Thanks [@dm-balakin](https://github.com/dm-balakin)! - Fixed theme change behavior on ios 26
