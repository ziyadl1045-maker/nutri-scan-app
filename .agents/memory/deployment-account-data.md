---
name: Deployment account data
description: Difference between development and production account records for the mobile app.
---

The APK points at the published production URL, so it authenticates against the production database. Development users and subscription flags are not automatically available in production; publishing code alone cannot be treated as a data migration.

**Why:** The development database can contain Premium test accounts while production contains a different user set, making the APK appear to lose Premium status even when the web preview works.

**How to apply:** Before a real-device release, verify Premium account counts in both environments and use an approved data migration or create the accounts in production. Never point a release APK at a temporary development URL as a shortcut.