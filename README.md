# ⚓ Battleship — P2P Multiplayer Naval Combat

A modern, real-time, peer-to-peer multiplayer Battleship game built with **Next.js 15**, **TypeScript**, and **Supabase Realtime**. Experience the classic naval warfare with a sleek dark-navy interface, immersive sound effects, and zero-latency P2P synchronization.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?style=flat-square&logo=supabase)
![Zustand](https://img.shields.io/badge/Zustand-State-orange?style=flat-square&logo=react)

---

## 🚀 Key Features

### 📡 Real-time P2P Multiplayer
No custom backend server required! The game leverages **Supabase Realtime Channels** (Presence & Broadcast) to synchronize game states directly between browser peers.

### 🎮 Dynamic Gameplay Logic
- **Standard Rules:** All 5 classic ships (Carrier, Battleship, Cruiser, Submarine, Destroyer).
- **"Hit-Again" Rule:** Keep your turn as long as you land a hit on the enemy fleet.
- **Ready Sync:** Robust P2P handshake ensures both players are ready before battle begins.

### 🚢 Advanced Ship Placement
- Interactive drag-and-drop/click placement.
- Seamless rotation support (press **'R'**).
- **Auto-placement** algorithm for quick deployment.

### 🔊 Immersive Audio Experience
- **Dynamic Battle Theme:** Music that intensifies when the combat phase begins.
- **Cinematic SFX:** High-quality sounds for firing shots, explosions on hits, and turn transitions.
- **Global Volume Control:** Adjust your audio experience directly from the status bar.

### 🎨 Modern UI/UX
- **Dark Navy Aesthetics:** A clean, military-inspired interface with glassmorphism effects.
- **Responsive Design:** Fully playable on desktops, tablets, and mobile devices.
- **Victory/Defeat States:** Clear visual and audio feedback upon game conclusion.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Networking:** [Supabase Realtime](https://supabase.com/docs/guides/realtime) (Presence & Broadcast)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling:** Vanilla CSS (Modular & Glassmorphic)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Fonts:** Outfit & JetBrains Mono

---

## 🏁 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/battleship.git
cd battleship
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. To test the multiplayer, open another window in **Incognito mode** or a different browser.

---

## 📜 Credits & Assets

Special thanks to the creators on **OpenGameArt.org** for the amazing assets:

- **Battle Theme:** [Battle Theme A](https://opengameart.org/content/battle-theme-a) by **cynicmusic**.
- **Sound Effects:** [Sci-Fi Sound Effects Library](https://opengameart.org/content/sci-fi-sound-effects-library) by **LittleRobotSoundFactory**.
- **Ship Sunk SFX:** [Big Explosion](https://opengameart.org/content/big-explosion) by **Blender Foundation** 
- **Ship Assets:** [Sea Warfare Set](https://opengameart.org/content/sea-warfare-set-ships-and-more) by **Lowder2**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for the Naval Combat fans.
</p>
