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

## Android screen alerts

ResiGrid uses Web Push to show report and alert notifications in the Android notification tray when the website is closed. The user must enable **Turn on screen alerts** from the home-page Notifications panel. Android and browser notification settings control lock-screen visibility and whether the display wakes.

Before deploying:

1. Generate one VAPID key pair with `npx web-push generate-vapid-keys` and keep it stable.
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (for example `mailto:alerts@example.com`), and `SUPABASE_SERVICE_ROLE_KEY` in the server environment. Keep the private and service-role keys server-only.
3. Apply [`supabase/migrations/20261020090000_web_push.sql`](./supabase/migrations/20261020090000_web_push.sql) to the Supabase project.
4. Deploy the site over HTTPS. Users must grant notification permission on their Android browser or installed PWA.

This configures Android Web Push. A native Android app still needs an Android project and its own Firebase Cloud Messaging setup.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
