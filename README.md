# KineticForm

KineticForm is a mobile-first, local-only workout tracker built with React Native, Expo, TypeScript, and Expo Router.

## V0.1

- Today view with a clear planned workout and resumable active session
- Set, rep, and weight logging with haptic completion feedback
- Automatic rest timer with skip and +30 second controls
- Persistent workout-in-progress and completed-session data
- Progress dashboard with volume trend and workout history
- Local preferences for weight units
- Dedicated iOS and Android project configuration

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
