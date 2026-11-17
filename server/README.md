# Ritika test backend

Deployment copy of the verified Ritika server. Original source tests remain in the full Ritika project.

Build: npm ci --include=dev && npm run build
Start: npm start
Environment: NODE_ENV=production, MUSIC_PROVIDERS=mock, HOST=0.0.0.0; use the hosting PORT.
Health: GET /health

Mock provides original test tones, not a commercial song catalogue. No provider keys or rights grants are included.
