# Ritika — Cross-Platform Music Streaming App

Free, ad-supported music streaming app built with React Native, Expo, TypeScript, Zustand, TanStack Query, and a Fastify backend proxy.

## Quick Start

1. **Install mobile dependencies**
   ```bash
   npm install
   ```

2. **Start the Fastify backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. **Run unit tests**
   ```bash
   npm test
   ```

4. **Run on Android / iOS (Dev Client required for TrackPlayer & AdMob)**
   ```bash
   npx expo prebuild
   npx expo run:android
   ```
