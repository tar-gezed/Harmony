// This file is intended to be generated during a CI/CD process.
// For local development, you can manually create this file.
// In a GitHub Action, you could generate it like this:
// echo "export const lastFmApiKey = '${{ secrets.LASTFM_API_KEY }}';" > src/config.ts

export type MusicProvider = 'deezer' | 'lastfm';

// --- SERVICE CONFIGURATION ---
// Change this to 'lastfm' to switch to the Last.fm/MusicBrainz provider.
export const activeProvider: MusicProvider = 'deezer';

// --- API KEYS ---
// Last.fm API Key (only needed if activeProvider is 'lastfm')
export const lastFmApiKey: string  = 'YOUR_LAST_FM_API_KEY';
