<div align="center">

<img width="1200" height="475" alt="NeonGen Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ⚡ NeonGen AI Studio

**The next-generation AI creative studio — Powered by Google Gemini & Veo**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google)](https://ai.google.dev)

🔗 **Live App:** [Open in AI Studio](https://ai.studio/apps/64ef24ab-b2cf-4b9f-8f01-efb0030caf0d)

</div>

---

## 🚀 What is NeonGen?

NeonGen is a premium AI creative studio that gives creatives and developers a unified interface to generate images, cinematic videos, and have intelligent multi-turn conversations — all powered by the latest Google Gemini and Veo models.

### ✨ Core Features

| Feature | Description |
|---|---|
| 🖼 **Image Generation** | Create photorealistic images using `gemini-2.5-flash-image` or `gemini-3-pro-image-preview`. Supports aspect ratios, negative prompts, and reference image input. |
| 🎬 **Video Generation** | Generate cinematic videos with Veo (`veo-3.1-fast-generate-preview`). Control aspect ratio, resolution (720p / 1080p), and duration. |
| 💬 **AI Chat** | Multi-turn conversations with streaming responses. Choose from multiple Gemini models. Persistent conversation history. |
| 🎨 **Style Profiles** | Upload 50–100 reference images and let Gemini analyze and extract a reusable style/character profile for consistent generations. |
| 🗂 **Gallery** | Browse, preview, search, download, and delete all your generated images and videos in one unified media library. |
| 💰 **Pricing** | Free, Pro ($29/mo), and Enterprise ($99/mo) tiers with monthly / annual billing toggle. |
| 📖 **API Docs** | Built-in interactive API documentation with code examples for Chat, Image, and Video APIs. |

---

## 🏃 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
#    Copy .env.example → .env.local and set your key:
echo 'GEMINI_API_KEY="YOUR_KEY_HERE"' > .env.local

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 📁 Project Structure

```
GOOGLE-NEONGEN/
├── src/
│   ├── App.tsx                   # Router & route definitions
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global styles & design tokens
│   ├── pages/
│   │   ├── Home.tsx              # Landing page with hero & features
│   │   ├── Chat.tsx              # AI chat interface
│   │   ├── ImageGen.tsx          # Image generation studio
│   │   ├── VideoGen.tsx          # Video generation studio
│   │   ├── Gallery.tsx           # Media library
│   │   ├── CreateProfile.tsx     # Style profile creator
│   │   ├── Pricing.tsx           # Subscription plans
│   │   └── Docs.tsx              # API documentation
│   ├── components/
│   │   ├── layout/Header.tsx     # Top navigation bar
│   │   ├── ui/ParticleBackground.tsx
│   │   ├── chat/                 # ChatSidebar, ChatArea, ChatMessage, ModelSelector
│   │   ├── image-gen/            # ImageControls, ImageOutput, ImageHistory
│   │   └── video-gen/            # VideoControls, VideoOutput
│   ├── stores/
│   │   ├── chatStore.ts          # Zustand: conversation history & model selection
│   │   ├── imageStore.ts         # Zustand: image generation state & history
│   │   ├── videoStore.ts         # Zustand: video generation state & history
│   │   └── styleStore.ts         # Zustand: style profiles
│   ├── lib/
│   │   ├── api/gemini.ts         # Google GenAI SDK wrapper (chat, image, video, style)
│   │   └── utils.ts              # Utility helpers (cn, etc.)
│   └── layouts/
│       └── RootLayout.tsx        # Shared layout wrapper (Header + Outlet)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | TailwindCSS 4 |
| Routing | React Router v7 |
| State Management | Zustand 5 (with `persist` middleware) |
| Animations | Motion (Framer Motion) |
| AI SDK | `@google/genai` |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `APP_URL` | ❌ Optional | Deployment URL (auto-injected on Cloud Run) |

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `localhost:3000` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Remove `dist/` directory |

---

## 🌐 Deployment

This app is designed to be deployed on **Google Cloud Run** via **AI Studio**. The `GEMINI_API_KEY` and `APP_URL` are automatically injected by AI Studio at runtime. See [`cloud.md`](./cloud.md) for detailed cloud architecture and deployment specifications.

---

<div align="center">

**Built with ❤️ using Google Gemini, React, and Vite**

</div>
