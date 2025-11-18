# Harmony - Music Album Rater 🎵

[![Deploy to GitHub Pages](https://github.com/tar-gezed/harmony/actions/workflows/deploy.yml/badge.svg)](https://github.com/tar-gezed/harmony/actions/workflows/deploy.yml)

**Live Demo: [https://tar-gezed.github.io/harmony/](https://tar-gezed.github.io/harmony/)**

Harmony is a sleek and modern web application that lets you search for any music album, rate each track individually, and generate a beautiful, shareable infographic for your social media. Built with a "glassmorphism" aesthetic, it provides a visually stunning experience for music lovers.

---

## ✨ Features

-   **🔎 Album Search**: Quickly find any album by any artist using the powerful Deezer or Last.fm APIs.
-   **⭐ Track-by-Track Rating**: Go beyond a simple album score. Rate every song on a scale of 0-10 to capture your nuanced opinion.
-   **📊 Instant Infographic Generation**: Once all tracks are rated, Harmony instantly creates a stunning, mobile-friendly (9:16 aspect ratio) infographic.
-   **🎨 Dynamic & Beautiful Design**: The infographic features the artist's picture as a blurred background, album art, track ratings, and key stats like "Best Song," "Worst Song," and an overall album score.
-   **📱 Shareable Content**: Download your generated rating as a high-resolution PNG, perfect for sharing on Instagram Stories, Twitter, or with friends.
-   **🚀 Modern Tech Stack**: Built with the latest zoneless Angular, Signals for state management, and styled with Tailwind CSS for a responsive and beautiful UI.

## 🚀 How to Use

1.  **Visit the Website**: Go to [https://tar-gezed.github.io/harmony/](https://tar-gezed.github.io/harmony/).
2.  **Search**: Enter the artist and album name you want to rate.
3.  **Rate**: Use the simple inputs to give each track a score from 0 to 10.
4.  **Generate**: Once all tracks are rated, click the "Generate Infographic" button.
5.  **Download & Share**: Your personalized album rating is ready! Download it and share your musical taste with the world.

## 🛠️ Tech Stack

-   **Framework**: Angular (v20+, Zoneless, Standalone Components, Signals)
-   **Styling**: Tailwind CSS
-   **APIs**:
    -   Deezer API (for album and track data)
    -   Last.fm & MusicBrainz API (alternative data source)
-   **Image Generation**: `html2canvas` library
-   **Deployment**: GitHub Pages via GitHub Actions

## ⚙️ Local Development & Contribution

Want to run Harmony locally or contribute? Here’s how:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/tar-gezed/harmony.git
    cd harmony
    ```

2.  **Set up API Keys (Optional for Last.fm)**:
    The application can switch between Deezer and Last.fm as data providers.
    -   The **Deezer** provider (default) works out-of-the-box.
    -   To use the **Last.fm** provider, you need an API key. Open the `src/config.ts` file and add a new line to export your key:
    ```typescript
    // src/config.ts

    // ... existing content ...

    // --- API KEYS ---
    // Last.fm API Key (only needed if activeProvider is 'lastfm')
    export const lastFmApiKey = 'YOUR_LASTFM_API_KEY';
    ```
    Then, update `activeProvider` in the same file to switch to Last.fm:
    ```typescript
    // src/config.ts
    // ...
    export const activeProvider: MusicProvider = 'lastfm';
    ```

3. **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    ng serve
    ```
    Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files..

---

Built with ❤️ for music fans.
