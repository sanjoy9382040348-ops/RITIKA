#!/usr/bin/env bash
set -e
npm install
npx eas-cli build --platform android --profile preview
