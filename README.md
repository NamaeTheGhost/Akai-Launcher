<div align="center">

# 🎮 Akai Game Launcher

**A sleek, modern desktop game launcher built for gamers who appreciate simplicity and speed.**

![Version](https://img.shields.io/badge/version-0.5.0-red?style=flat-square)
[![Electron](https://img.shields.io/badge/Electron-v39-47848F?style=flat-square&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-v7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows_|_macOS_|_Linux-lightgrey?style=flat-square)](https://github.com/NamaeTheGhost/akai-game-launcher)
![Source Only](https://img.shields.io/badge/distribution-source%20only-orange?style=flat-square)

</div>

---

## ✨ Features

- 🏠 **Home Dashboard** — A clean overview of your gaming activity and recently played titles
- 📚 **Game Library Management** — Organize and browse your entire game collection in one place
- ➕ **Custom Game Support** — Add any game manually with the custom game modal
- 🗂️ **Collection Management** — Group games into custom collections for easy access
- 🔍 **Auto-Scan** — Automatically detect installed games on your system
- 🎮 **Game Detail View** — Rich per-game detail pages with metadata and launch options
- ⚙️ **Settings & Preferences** — Persistent user preferences with a dedicated settings page
- 🪟 **Custom Titlebar & Statusbar** — Native-feeling UI with a fully custom chrome
- 🔲 **Overlay Support** — In-game overlay functionality for quick access
- 🔐 **Session Management** — Lightweight session handling via custom React hooks
- 🌍 **Cross-Platform** — Runs on Windows, macOS, and Linux

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Shell | [Electron v39](https://electronjs.org) |
| UI Framework | [React v19](https://react.dev) |
| Language | [TypeScript](https://typescriptlang.org) |
| Styling | [TailwindCSS v4](https://tailwindcss.com) |
| Bundler | [Vite v7](https://vitejs.dev) |
| Electron Build Tool | [electron-vite](https://electron-vite.org) |
| Packaging | [electron-builder](https://www.electron.build) |
| Routing | [react-router-dom](https://reactrouter.com) |

---

## 🚀 Getting Started

> **Note:** No prebuilt binaries are provided. You'll need to clone the repository and build the app yourself from source.

### Prerequisites

- [Node.js](https://nodejs.org) `>= 18.x`
- [npm](https://npmjs.com) `>= 9.x`
- [Git](https://git-scm.com)

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/NamaeTachii/akai-game-launcher.git
cd akai-game-launcher

# Install dependencies
npm install
```

---

## 💻 Development

Start the app in development mode with hot-reload:

```bash
npm run dev
```

This launches both the Electron shell and the Vite dev server simultaneously via `electron-vite`.

---

## 📦 Build & Packaging

To produce a distributable binary for your platform, run the appropriate build command:

```bash
# Windows (.exe / NSIS installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage / .deb)
npm run build:linux
```

Output files will be placed in the `dist/` directory.

> 💡 **Tip:** Cross-platform builds may require platform-specific toolchains. Refer to the [electron-builder docs](https://www.electron.build/multi-platform-build) for setup guidance. Building on the same OS as your target platform is recommended for best results.

---

## 🗂️ Project Structure

```
akai-game-launcher/
├── src/
│   ├── main/                  # Electron main process
│   ├── preload/               # Preload scripts
│   └── renderer/              # React application
│       ├── components/
│       │   ├── CustomGameModal.tsx
│       │   ├── CollectionModal.tsx
│       │   ├── GameDetails.tsx
│       │   ├── Titlebar.tsx
│       │   └── StatusBar.tsx
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Library.tsx
│       │   ├── Settings.tsx
│       │   └── About.tsx
│       ├── context/
│       │   ├── ScanContext.tsx
│       │   └── PreferencesContext.tsx
│       ├── hooks/
│       │   └── useSession.ts
│       └── OverlayApp.tsx
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
└── tsconfig.json
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's a bug report, feature suggestion, or a pull request — all input is appreciated.

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to your branch: `git push origin feat/your-feature-name`
5. **Open** a Pull Request

Please follow the existing code style and keep commits clean and descriptive. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**NamaeTachii**

- GitHub: [@NamaeTheGhost](https://github.com/NamaeTheGhost)

---

<div align="center">
  <sub>Built with ❤️ using Electron + React + TypeScript</sub>
</div>
