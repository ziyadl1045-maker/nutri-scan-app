---
name: Android billing builds
description: Non-obvious build requirements for Google Play billing in the NutriScan Android artifact.
---

Google Play billing is included through `cordova-plugin-purchase`; cloud builds must resolve that package from `https://registry.npmjs.org` and run Capacitor sync so the Cordova Android plugin and BillingClient dependency are generated.

**Why:** The Replit package firewall registry is not reachable from Codemagic, and installing the JavaScript package without syncing leaves the APK with no billing bridge.

**How to apply:** Keep the public npm registry in the Android build dependency step, keep the plugin in the lockfile, and verify the generated Android project contains the purchase plugin before publishing a new APK.