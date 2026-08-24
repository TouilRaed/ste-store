# Store Admin — mobile

Expo (SDK 57) + expo-router admin app for the store. Same job as the web `/admin` tab:
orders, order status, and the product catalogue — on a phone.

It talks to the Next.js app over `/api/admin/*` with a bearer token, so the Supabase service-role
key never leaves the server.

## Run it

```bash
npm install
npm start          # then press a (Android), i (iOS), w (web)
```

Sign in with the same `ADMIN_PASSWORD` as the web admin.

### Pointing at your server

Default is `http://localhost:3000`, which only works on a simulator running on the same machine.

- Physical device on the same Wi-Fi: use your computer's LAN address.
- Deployed site: use the public URL.

Either set it in `app.config.ts`:

```ts
extra: { apiBaseUrl: "https://your-project.vercel.app" }
```

or at run time:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.12:3000 npm start
```

The current value is shown on the login screen and in Settings.

For a browser preview (`npm start`, then `w`), the Next.js server must allow the Metro origin.
In development any `localhost` origin is allowed automatically; in production list the origins in
`ADMIN_CORS_ORIGINS` on the server. Native builds don't need this — CORS doesn't apply to them.

## Structure

```
app/
  _layout.tsx          Auth gate + stack
  index.tsx            Redirects to dashboard or login
  login.tsx            Password → JWT → keychain
  (tabs)/              Dashboard · Orders · Products · Settings
  orders/[id].tsx      Order detail, status changes, mailto
  products/[id].tsx    Edit
  products/new.tsx     Create
components/
  ui.tsx               Card, Button, Chip, Field, Toggle, badges
  ProductForm.tsx      Shared create/edit form
lib/
  api.ts               Typed client; 401 → clears token, back to login
  auth.ts              Token store (useSyncExternalStore)
  storage.ts           SecureStore on device, localStorage on web
  theme.ts             Mirrors the web palette
  types.ts             Mirrors /api/admin payloads
  use-async.ts         Load / refresh / error hook
```

## Building

```bash
npx expo prebuild      # native projects
npx eas build -p android --profile preview
```

`ios.bundleIdentifier` and `android.package` derive from `BRAND.KEY` in `app.config.ts`
(`com.<KEY>.admin`) — set the key before shipping to a store.
