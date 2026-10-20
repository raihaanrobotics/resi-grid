This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase email confirmation

Email sign-up redirects to the app's `/auth/callback` route instead of relying on the Supabase default site URL. For web builds, the redirect uses the current site origin. For native Capacitor builds, set `NEXT_PUBLIC_SITE_URL` to the public HTTPS website URL at build time; never use `localhost` for a distributed app.

In Supabase Dashboard → Authentication → URL Configuration:

1. Set **Site URL** to the production HTTPS website URL.
2. Add the exact redirect URL `https://your-production-domain/auth/callback` to the allowed redirect URLs. Add `http://localhost:3000/auth/callback` separately for local development if needed.
3. Keep the confirmation email template pointed at Supabase's `{{ .ConfirmationURL }}` so Supabase honors the per-sign-up redirect URL.

For a native build, set `NEXT_PUBLIC_SITE_URL` to the same production URL before `npx cap sync android` and building the app.

## Android screen alerts

ResiGrid uses Web Push for the website and OneSignal for native Capacitor push. Native notifications are sent by a Supabase Edge Function, so the Android app does not depend on the Next.js API routes (the app is built as a static export).

### Website Web Push

1. Generate one VAPID key pair with `npx web-push generate-vapid-keys` and keep it stable.
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (for example `mailto:alerts@example.com`), and `SUPABASE_SERVICE_ROLE_KEY` in the server environment. Keep the private and service-role keys server-only.
3. Apply [`supabase/migrations/20261020090000_web_push.sql`](./supabase/migrations/20261020090000_web_push.sql) to the Supabase project.
4. Deploy the site over HTTPS. Users must grant notification permission on their Android browser or installed PWA.

### Native Android Push

1. Create/configure a OneSignal app with the Android package id `com.resigrid.app` and add its Android platform. OneSignal requires Android FCM credentials configured in its dashboard; keep the private key there and never commit it.
2. Set `NEXT_PUBLIC_ONESIGNAL_APP_ID` when building the app.
3. Set the Supabase Edge Function secrets `ONESIGNAL_APP_ID` and `ONESIGNAL_APP_API_KEY` (the OneSignal App API key is server-only).
4. Apply the push migration and deploy the Edge Function:

   ```powershell
   npx supabase functions deploy native-push
   ```

5. Sync and build the Android app:

   ```powershell
   npx cap sync android
   ```

The app requests location and notification permission after sign-in. Android notification settings and lock-screen privacy settings still control whether notifications appear on the lock screen and wake the display.

## Radar report ownership and numbering

Apply [`supabase/migrations/20261020150000_radar_report_ownership.sql`](./supabase/migrations/20261020150000_radar_report_ownership.sql) to the Supabase project before using report deletion or submitting reports with sequential `RPT-0001`-style references. The migration assigns the authenticated reporter as the owner and restricts report deletion to that owner. You can apply it with `npx supabase db push` from a linked Supabase project, or run the SQL in the Supabase SQL Editor.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
