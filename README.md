# KineticForm

KineticForm is a mobile-first, local-only workout tracker built with React Native, Expo, TypeScript, and Expo Router.

## V0.2

- Today view with a clear planned workout and resumable active session
- Set, rep, and weight logging with haptic completion feedback
- Automatic rest timer with skip and +30 second controls
- Persistent workout-in-progress and completed-session data
- Progress dashboard with volume trend and workout history
- Local preferences for weight units
- Dedicated iOS and Android project configuration
- Integrated workout schedule with recurring days, completion state, and one-tap workout launch
- Optional Google Calendar OAuth sync plus a no-account Google Calendar handoff
- Searchable 47-exercise library with filters, details, history, and custom exercises
- Reusable workout builder with ordering, duplication, notes, and strength/cardio fields
- Reviewed PDF, DOCX, plain-text, and pasted-plan import
- Single-workout, weekly, monthly, full-program, and history PDF-style exports

## Google Calendar setup

Direct Google Calendar sync uses Google Identity Services in the web build. Create a Google OAuth 2.0 Web client, enable the Google Calendar API, add `https://intouchktakizawa.github.io` as an authorized JavaScript origin, then build with:

```bash
EXPO_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com" npm run build:web
```

Without that value, scheduling still works locally and each session has an **Add to Google Calendar** link that opens a pre-filled event. No client secret is stored in the app.

No account, network connection, subscription, or backend is required. Workout data is stored on the device with AsyncStorage.

## Run locally

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `i`, `a`, or `w` for iOS, Android, or web.

The public web build is deployed to GitHub Pages at `https://intouchktakizawa.github.io/KineticForm/`.

## Quality checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## Structure

- `src/app` — Expo Router screens and navigation
- `src/components` — reusable interface components
- `src/store` — local workout state and persistence
- `src/data` — workout plans and starter progress data
- `src/types` — shared workout data types
- `src/constants` — visual design tokens

The store and data models are separated from the screens so a future backend can replace local persistence without rebuilding the interface.
