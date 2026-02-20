# ☁️ NeonGen AI Studio — Complete Application Specification

> **Version:** 1.0.0 | **Platform:** Google AI Studio / Cloud Run | **Stack:** React 19 + TypeScript + Vite + Google Gemini

---

## 📋 Table of Contents

1. [App Overview](#1-app-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Directory & File Blueprint](#3-directory--file-blueprint)
4. [Pages Specification](#4-pages-specification)
5. [Components Specification](#5-components-specification)
6. [State Management (Stores)](#6-state-management-stores)
7. [API Layer (lib/api)](#7-api-layer-libapi)
8. [Routing Map](#8-routing-map)
9. [Design System & Styling](#9-design-system--styling)
10. [Environment & Configuration](#10-environment--configuration)
11. [Cloud & Deployment Architecture](#11-cloud--deployment-architecture)
12. [AI Models Used](#12-ai-models-used)
13. [Data Flow Diagrams](#13-data-flow-diagrams)
14. [Pricing & Subscription Tiers](#14-pricing--subscription-tiers)
15. [API Documentation (Built-in)](#15-api-documentation-built-in)

---

## 1. App Overview

**NeonGen AI Studio** is a full-featured, browser-based AI creative platform. It provides a unified interface for three core AI modalities:

- **Text-to-Image** generation with style and aspect-ratio controls
- **Text-to-Video** generation with resolution and duration controls
- **Conversational AI** with multi-model selection and streaming output

Additionally, it includes a **Style Profile** system that analyzes a batch of user-uploaded reference images using Gemini's multimodal capabilities and generates a character/style descriptor for consistent future generations.

The app is designed to run on **Google AI Studio** (which injects the Gemini API key at runtime) and is deployable to **Google Cloud Run**.

---

## 2. Tech Stack & Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.0.0 | UI framework |
| `react-dom` | ^19.0.0 | DOM renderer |
| `react-router-dom` | ^7.13.0 | Client-side routing |
| `@google/genai` | ^1.29.0 | Google Gemini & Veo SDK |
| `zustand` | ^5.0.11 | Client-side state management (with `persist`) |
| `motion` | ^12.23.24 | Animations (Framer Motion) |
| `lucide-react` | ^0.546.0 | Icon library |
| `react-markdown` | ^10.1.0 | Markdown rendering for chat messages |
| `react-hook-form` | ^7.71.1 | Form state management |
| `zod` | ^4.3.6 | Schema validation |
| `clsx` | ^2.1.1 | Conditional class utilities |
| `tailwind-merge` | ^3.5.0 | Tailwind class merging |
| `@tailwindcss/vite` | ^4.1.14 | TailwindCSS Vite plugin |
| `vite` | ^6.2.0 | Build tool & dev server |
| `express` | ^4.21.2 | (Optional) Backend scaffolding |
| `better-sqlite3` | ^12.4.1 | (Optional) Local database |
| `dotenv` | ^17.2.3 | Environment variable loading |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ~5.8.2 | Static typing |
| `@vitejs/plugin-react` | ^5.0.4 | React Fast Refresh for Vite |
| `@types/node` | ^22.14.0 | Node.js type definitions |
| `@types/express` | ^4.17.21 | Express type definitions |
| `tsx` | ^4.21.0 | TypeScript execution for scripts |
| `autoprefixer` | ^10.4.21 | CSS autoprefixer |

---

## 3. Directory & File Blueprint

```
GOOGLE-NEONGEN/
│
├── 📄 index.html                      # HTML entry point (Vite)
├── 📄 package.json                    # Dependency manifest & npm scripts
├── 📄 vite.config.ts                  # Vite build configuration
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 .env.example                    # Environment variable template
├── 📄 .gitignore                      # Git ignore rules
├── 📄 metadata.json                   # AI Studio app metadata
├── 📄 README.md                       # Project overview & quick start
├── 📄 cloud.md                        # This file — full app specification
│
└── src/
    │
    ├── 📄 main.tsx                    # React DOM root mount
    ├── 📄 App.tsx                     # Root component with BrowserRouter & Routes
    ├── 📄 index.css                   # Global CSS, Tailwind directives, CSS variables
    │
    ├── pages/                         # Top-level route views
    │   ├── 📄 Home.tsx                # / — Landing page
    │   ├── 📄 Chat.tsx                # /chat — AI conversation interface
    │   ├── 📄 ImageGen.tsx            # /generate/image — Image generation studio
    │   ├── 📄 VideoGen.tsx            # /generate/video — Video generation studio
    │   ├── 📄 Gallery.tsx             # /gallery — Generated media library
    │   ├── 📄 CreateProfile.tsx       # /profiles/create — Style profile wizard
    │   ├── 📄 Pricing.tsx             # /pricing — Subscription plans
    │   └── 📄 Docs.tsx                # /docs — Interactive API documentation
    │
    ├── components/                    # Reusable UI components
    │   ├── layout/
    │   │   └── 📄 Header.tsx          # Sticky top navigation bar + mobile menu
    │   ├── ui/
    │   │   └── 📄 ParticleBackground.tsx # Animated canvas particle effect
    │   ├── chat/
    │   │   ├── 📄 ChatSidebar.tsx     # Conversation list + new chat button
    │   │   ├── 📄 ChatArea.tsx        # Message thread + input box + streaming
    │   │   ├── 📄 ChatMessage.tsx     # Individual message bubble with Markdown
    │   │   └── 📄 ModelSelector.tsx   # Gemini model dropdown (flash / pro)
    │   ├── image-gen/
    │   │   ├── 📄 ImageControls.tsx   # Left panel: prompt, model, ratio, reference
    │   │   ├── 📄 ImageOutput.tsx     # Right panel: generated image preview
    │   │   └── 📄 ImageHistory.tsx    # Bottom strip: recent generations
    │   └── video-gen/
    │       ├── 📄 VideoControls.tsx   # Left panel: prompt, model, ratio, duration
    │       └── 📄 VideoOutput.tsx     # Right panel: video player + status polling
    │
    ├── stores/                        # Zustand state stores (persisted to localStorage)
    │   ├── 📄 chatStore.ts            # Conversations, messages, model selection
    │   ├── 📄 imageStore.ts           # Image prompt, model, ratio, history
    │   ├── 📄 videoStore.ts           # Video prompt, model, duration, status
    │   └── 📄 styleStore.ts           # Style profiles (AI-analyzed character data)
    │
    ├── lib/
    │   ├── 📄 utils.ts                # cn() — clsx + tailwind-merge helper
    │   └── api/
    │       └── 📄 gemini.ts           # GeminiService: chat, image, video, style analysis
    │
    └── layouts/
        └── 📄 RootLayout.tsx          # Wraps all routes: Header + <Outlet />
```

---

## 4. Pages Specification

### 4.1 `/` — Home Page (`Home.tsx`)
- **Purpose:** Marketing landing page
- **Sections:**
  - **Hero:** Full-width animated section with gradient headline, version badge, and two CTA buttons ("Start Creating" → `/generate/image`, "View API Docs" → `/docs`)
  - **Features Grid:** 3-column card grid (Image Generation, Video Production, Intelligent Chat) with hover lift animation
  - **API Highlight:** 2-column split — feature list + live code snippet showing the NeonGen API
- **UI Elements:** `ParticleBackground`, `motion.div` with fade-in animation, `FeatureCard` component
- **Dependencies:** `react-router-dom` (Link), `lucide-react`, `motion/react`

---

### 4.2 `/chat` — AI Chat (`Chat.tsx`)
- **Purpose:** Multi-turn conversational AI interface
- **Layout:** Sidebar (hidden on mobile) + main chat area
- **Behavior:** Auto-creates a new conversation if none exist
- **Sub-components:**
  - `ChatSidebar` — lists conversations, allows creating new ones and deleting existing ones, shows model name
  - `ChatArea` — displays message thread, input textarea, model selector, send button; supports streaming responses via `geminiService.streamContent()`
  - `ChatMessage` — renders individual messages; user messages are right-aligned, model messages are left-aligned with Markdown rendering via `react-markdown`
  - `ModelSelector` — dropdown to switch between `gemini-3-flash-preview`, `gemini-3-pro-preview`, etc.
- **Store:** `useChatStore` (persisted as `neongen-chat-storage`)

---

### 4.3 `/generate/image` — Image Studio (`ImageGen.tsx`)
- **Purpose:** Text-to-image generation interface
- **Layout:** Horizontal split — Controls (left) + Output (right) + History strip (bottom)
- **Sub-components:**
  - `ImageControls` — prompt textarea, negative prompt, model selector, aspect ratio picker (1:1, 16:9, 9:16, 4:3, 3:4), reference image upload, generate button
  - `ImageOutput` — displays the current generated image, loading skeleton, download/delete actions
  - `ImageHistory` — horizontal scrollable strip of previous generations; click to set as current
- **Models Supported:**
  - `gemini-2.5-flash-image` (default, fast)
  - `gemini-3-pro-image-preview` (high quality, supports 1K resolution)
- **Features:** Reference image input (multimodal → style-copy prompt injection), aspect ratio control, negative prompts
- **Store:** `useImageStore` (persisted as `neongen-image-storage`)

---

### 4.4 `/generate/video` — Video Studio (`VideoGen.tsx`)
- **Purpose:** Text-to-video generation interface
- **Layout:** Horizontal split — Controls (left) + Output (right)
- **Sub-components:**
  - `VideoControls` — prompt textarea, model selector, aspect ratio (16:9 / 9:16), duration (5s), resolution (720p / 1080p), generate button
  - `VideoOutput` — displays video player when done, status polling messages (operation polling every 5 seconds), progress indicators
- **Models Supported:**
  - `veo-3.1-fast-generate-preview` (default, ~5s clips)
- **Polling:** Uses `geminiService.pollVideoOperation()` — long-polling every 5,000ms until `operation.done === true`
- **Video Download:** Fetches video binary via `fetch()` with `x-goog-api-key` header, creates a blob URL
- **Store:** `useVideoStore` (persisted as `neongen-video-storage`)

---

### 4.5 `/gallery` — Media Gallery (`Gallery.tsx`)
- **Purpose:** Unified media library for all generated images and videos
- **Features:**
  - Combined image + video feed sorted by timestamp (newest first)
  - **Search:** Filter by prompt text
  - **Filter:** Toggle between All / Images / Videos
  - **Grid:** Responsive (1→2→3→4 columns based on viewport)
  - **Hover Overlay:** Download + Delete actions
  - **Video Indicator:** Play icon overlay on video thumbnails
  - **Lightbox Modal:** Full-screen preview with metadata panel (prompt, model, date, aspect ratio, duration), download + delete buttons
- **Stores:** `useImageStore` + `useVideoStore`

---

### 4.6 `/profiles/create` — Style Profile Creator (`CreateProfile.tsx`)
- **Purpose:** AI-powered style/character profile engine
- **Workflow:**
  1. User enters a profile name (e.g., "Cyberpunk Protagonist")
  2. User uploads 50–100 reference images (drag-and-drop or file picker)
  3. System runs a 10-step simulated progress animation (~8 seconds)
  4. `geminiService.analyzeStyle()` is called with a subset of 3 images (to avoid payload limits)
  5. Gemini `gemini-3-pro-preview` extracts facial features, hair, skin tone, eye shape, etc.
  6. Generated text description is stored as a `StyleProfile`
  7. User is redirected to `/generate/image`
- **Analysis timeout:** 60 seconds (Promise.race with timeout rejection)
- **Store:** `useStyleStore` (persisted as `neongen-style-profiles`)

---

### 4.7 `/pricing` — Pricing Plans (`Pricing.tsx`)
- **Purpose:** Subscription tier display
- **Billing:** Monthly / Annual toggle (Annual saves 20%)
- **Plans:**

| Plan | Monthly | Annual | Key Limits |
|---|---|---|---|
| **Free** | $0 | $0 | 100 chat/mo, 20 images/mo, no video, watermark |
| **Pro** | $29 | $24 | Unlimited chat, 1000 images/mo, 50 videos/mo, no watermark |
| **Enterprise** | $99 | $89 | Unlimited all, full API access, SSO, fine-tuning, SLA |

- **UI:** Animated pricing cards with hover lift, "Most Popular" badge on Pro, neon glow effect on highlighted plan
- **Store:** None (static data)

---

### 4.8 `/docs` — API Documentation (`Docs.tsx`)
- **Purpose:** Built-in interactive API reference
- **Layout:** Two-panel — sidebar (section navigation) + content area
- **Sections:**
  - Getting Started → Introduction, Authentication, Rate Limits
  - Chat API → Create Completion, Streaming Responses
  - Image API → Generate Image
  - Video API → Generate Video
- **CodeBlock Component:** Displays syntax-highlighted code with a one-click copy button
- **Content:** Documents the `api.neongen.ai` REST API endpoints with `curl` and JavaScript examples

---

### Special Routes

| Path | Component | Notes |
|---|---|---|
| `/dashboard` | Inline `<div>` | Placeholder — "Dashboard (Coming Soon)" |
| `*` | Inline `<div>` | 404 Not Found fallback |

---

## 5. Components Specification

### `Header.tsx` (`src/components/layout/Header.tsx`)
- Sticky, `backdrop-blur-xl` top bar — always visible
- **Logo:** Neon "N" icon + "NeonGen" wordmark
- **Desktop Nav:** Icon + label links, active route highlighted with `bg-primary-neon/10 text-primary-neon`
- **Mobile Nav:** Hamburger → slide-in drawer (right side) with full nav + account section
- **Nav Items:** Home, Chat, Image, Video, Gallery, Pricing, API (Docs)
- **Account Button:** Gradient avatar → `/dashboard`

### `ParticleBackground.tsx` (`src/components/ui/ParticleBackground.tsx`)
- Animated canvas element rendering floating particles
- Positioned absolutely behind hero content on the Home page

### `ChatSidebar.tsx`
- Lists all conversations from `chatStore`
- "New Chat" button creates a fresh conversation
- Conversation items clickable to switch, with delete button on hover
- Shows `model` name as subtitle

### `ChatArea.tsx`
- Main message thread with auto-scroll
- Textarea input with Enter-to-send and `Shift+Enter` for newline
- Sends prompt to `geminiService.streamContent()`, appending streamed tokens in real-time
- Shows loading indicator during streaming

### `ChatMessage.tsx`
- User messages: right-aligned, solid bubble
- Model messages: left-aligned with Markdown rendering (`react-markdown`)

### `ModelSelector.tsx`
- Dropdown for selecting the active Gemini chat model
- Updates `chatStore.selectedModel`

### `ImageControls.tsx`
- Full-featured left panel for image generation
- Prompt textarea, negative prompt input
- Model selector (flash / pro)
- Aspect ratio visual picker (icon-based grid)
- Reference image uploader (base64 encoded, passed to Gemini as `inlineData`)
- "Generate" button → calls `geminiService.generateImage()`

### `ImageOutput.tsx`
- Right panel displaying the most recently generated image
- Loading skeleton during generation
- Download button, delete button
- Empty state prompt

### `ImageHistory.tsx`
- Horizontal scrollable thumbnail strip
- Click to set any past generation as current view

### `VideoControls.tsx`
- Prompt textarea
- Model selector (Veo models)
- Aspect ratio toggle (16:9 / 9:16)
- Duration selector
- Resolution selector (720p / 1080p)
- "Generate" button → calls `geminiService.generateVideo()`

### `VideoOutput.tsx`
- Video player once generation completes
- Status text during polling ("Waiting for video...", "Still processing...")
- Error display

---

## 6. State Management (Stores)

All stores use **Zustand v5** with the `persist` middleware (localStorage). Data survives page refreshes.

### `chatStore.ts` — `neongen-chat-storage`

```typescript
interface Conversation {
  id: string;          // UUID
  title: string;       // Auto-set from first message or 'New Chat'
  model: string;       // Gemini model ID
  messages: Message[]; // Array of user/model messages
  updatedAt: number;   // Unix timestamp
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
```

**Actions:** `createConversation`, `deleteConversation`, `addMessage`, `updateConversationTitle`, `setSelectedModel`, `setLoading`

---

### `imageStore.ts` — `neongen-image-storage`

```typescript
interface GeneratedImage {
  id: string;
  url: string;          // base64 data URI (data:image/png;base64,...)
  prompt: string;
  model: string;
  aspectRatio: string;
  timestamp: number;
}

// State also includes:
// prompt, negativePrompt, selectedModel, aspectRatio, referenceImage, isGenerating, currentImage
```

**Actions:** `addImage`, `deleteImage`, `setCurrentImage`, `setGenerating`, `setPrompt`, `setReferenceImage`, etc.

---

### `videoStore.ts` — `neongen-video-storage`

```typescript
interface GeneratedVideo {
  id: string;
  url: string;          // Blob URL (object URL from fetched video binary)
  prompt: string;
  model: string;
  aspectRatio: string;
  duration: string;
  timestamp: number;
}

// State also includes:
// prompt, selectedModel, aspectRatio, duration, resolution, isGenerating, generationStatus
```

**Actions:** `addVideo`, `deleteVideo`, `setCurrentVideo`, `setGenerating`, `setGenerationStatus`, etc.

---

### `styleStore.ts` — `neongen-style-profiles`

```typescript
interface StyleProfile {
  id: string;
  name: string;                     // User-defined name
  description: string;              // Gemini-generated character/style descriptor
  thumbnail: string;                // First reference image (base64)
  referenceImages: string[];        // Up to 5 reference images
  createdAt: number;
}
```

**Actions:** `addProfile`, `deleteProfile`, `setAnalyzing`, `getProfile`
**Note:** Only `profiles` array is persisted; `isAnalyzing` and `analysisProgress` are ephemeral.

---

## 7. API Layer (lib/api)

### `gemini.ts` — `geminiService`

Wraps `@google/genai` SDK. Initialized with `process.env.GEMINI_API_KEY` (injected at build time via Vite's `define`).

#### `generateContent(model, prompt) → string`
Simple text generation. Used for single-turn tasks.

#### `streamContent(model, prompt, history) → AsyncIterable`
Creates a chat session with full conversation history, sends a new message, and returns a streaming response. Used by `ChatArea` to display tokens as they arrive.

#### `generateImage(model, prompt, aspectRatio, referenceImage?) → base64DataURI`
- Calls `ai.models.generateContent()` with `imageConfig.aspectRatio`
- For `gemini-3-pro-image-preview`: also sets `imageConfig.imageSize = '1K'`
- If `referenceImage` (base64) is provided:
  - Prepends it as `inlineData` part before the text prompt
  - Enhances prompt instructing Gemini to match the reference style
- Extracts the `inlineData` from the response and returns a `data:image/png;base64,...` URI

#### `generateVideo(model, prompt, config) → Operation`
- Calls `ai.models.generateVideos()` with `numberOfVideos: 1`, `resolution`, `aspectRatio`
- Returns the long-running `Operation` object immediately (async job)
- Checks `window.aistudio.hasSelectedApiKey()` for AI Studio API key selection flow

#### `pollVideoOperation(operation) → blobURL`
- Polls `ai.operations.getVideosOperation()` every 5 seconds until `operation.done === true`
- Fetches video binary from the returned URI with Gemini API key in header
- Returns a `URL.createObjectURL(blob)` for playback

#### `analyzeStyle(images[]) → string`
- Takes a base64 image array, uses first 3 images (payload limit protection)
- Sends multimodal request to `gemini-3-pro-preview`
- Detailed prompt extracts: face shape, eyes, nose, mouth, hair, skin tone
- Returns a character descriptor string stored in the `StyleProfile`

---

## 8. Routing Map

```
/ (RootLayout)
├── /                        →  Home.tsx           (index)
├── /chat                    →  Chat.tsx
├── /generate/image          →  ImageGen.tsx
├── /generate/video          →  VideoGen.tsx
├── /gallery                 →  Gallery.tsx
├── /profiles/create         →  CreateProfile.tsx
├── /pricing                 →  Pricing.tsx
├── /docs                    →  Docs.tsx
├── /dashboard               →  inline placeholder
└── /*                       →  inline 404
```

`RootLayout` wraps every route and renders `<Header />` + `<Outlet />`.

---

## 9. Design System & Styling

### Color Tokens (via Tailwind CSS custom colors in `index.css`)

| Token | Usage |
|---|---|
| `primary-neon` | Primary accent (neon green `#39FF14`) |
| `primary-lime` | Hover/secondary accent (lime green) |
| `primary-orange` | Video-related accent |
| `background-primary` | Page background (near-black `#0A0A0A`) |
| `background-secondary` | Card/surface background (`#111111`) |

### Typography
- **Display font:** Used for headings (`font-display`) — bold, tight tracking
- **Mono font:** Used for code blocks and technical values

### Design Language
- **Dark mode only** — deep black backgrounds
- **Glassmorphism:** `backdrop-blur-*` + semi-transparent backgrounds (`bg-white/5`)
- **Neon accents:** `text-primary-neon`, `border-primary-neon/20`, `shadow-[0_0_30px_rgba(57,255,20,0.1)]`
- **Rounded corners:** `rounded-2xl`, `rounded-3xl` throughout
- **Animations:** Framer Motion (`motion.div`) — fade-in, y-offset, scale, hover lifts
- **Transitions:** `transition-colors`, `transition-opacity`, `transition-all` on interactive elements

---

## 10. Environment & Configuration

### `.env.example`
```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

### `vite.config.ts`
- **Plugins:** `@vitejs/plugin-react`, `@tailwindcss/vite`
- **Path alias:** `@` → `./src`
- **Env injection:** `process.env.GEMINI_API_KEY` replaced at build time via `define`
- **Dev server:** Port 3000, host 0.0.0.0
- **HMR:** Disabled when `DISABLE_HMR=true` (AI Studio agent edits)

### `tsconfig.json`
- Target: `ES2020`
- Strict mode enabled
- Path mapping: `@/*` → `src/*`

### `metadata.json`
- AI Studio app metadata (app ID, display name, etc.)

---

## 11. Cloud & Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Google AI Studio                        │
│                                                           │
│  ┌─────────────┐    ┌──────────────────────────────┐     │
│  │  Secrets    │───▶│  GEMINI_API_KEY (injected)   │     │
│  │  Panel      │    │  APP_URL       (injected)    │     │
│  └─────────────┘    └──────────────────────────────┘     │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │               Cloud Run Service                   │    │
│  │                                                   │    │
│  │   npm run dev → Vite dev server (port 3000)       │    │
│  │   npm run build → Static dist/ served via Vite   │    │
│  │                                                   │    │
│  │   React SPA (client-side only — no backend)       │    │
│  └──────────────────────────────────────────────────┘    │
│                              │                            │
└──────────────────────────────│────────────────────────────┘
                               │ HTTPS
                               ▼
                ┌──────────────────────────┐
                │   Google Gemini API      │
                │   api.generativelanguage │
                │   .googleapis.com        │
                │                          │
                │  • generateContent       │
                │  • chats.create          │
                │  • models.generateImages │
                │  • models.generateVideos │
                │  • operations.getVideos  │
                └──────────────────────────┘
```

### Architecture Notes
- **Frontend-only:** No custom backend server. All AI calls are made directly from the browser to the Gemini API.
- **API Key Security:** The `GEMINI_API_KEY` is injected at build time (Vite `define`) from environment variables. In production, this should be proxied through a backend.
- **State persistence:** All user data (conversations, images, videos, style profiles) is stored in `localStorage` via Zustand `persist`. No external database.
- **Video blobs:** Videos are stored as in-memory Blob URLs (`URL.createObjectURL`) and are not persisted across sessions (they cannot be serialized to localStorage).

---

## 12. AI Models Used

| Model ID | Type | Where Used | Notes |
|---|---|---|---|
| `gemini-3-flash-preview` | Chat | Chat page (default) | Fast, efficient |
| `gemini-3-pro-preview` | Chat | Chat page (selectable) | Most capable |
| `gemini-3-pro-preview` | Text | Style analysis | Multimodal capable |
| `gemini-2.5-flash-image` | Image | ImageGen (default) | Fast image generation |
| `gemini-3-pro-image-preview` | Image | ImageGen (selectable) | Supports 1K resolution |
| `veo-3.1-fast-generate-preview` | Video | VideoGen (default) | ~5s clips at 720p/1080p |

---

## 13. Data Flow Diagrams

### Chat Flow
```
User types message
      │
      ▼
ChatArea.handleSend()
      │
      ▼
chatStore.addMessage(userMessage)
      │
      ▼
geminiService.streamContent(model, prompt, history)
      │
      ▼
Google Gemini API → streaming response
      │
      ▼
appendChunks() → chatStore.addMessage(modelMessage)
      │
      ▼
ChatMessage renders with react-markdown
```

### Image Generation Flow
```
User enters prompt + configures options
      │
      ▼
ImageControls.handleGenerate()
      │
      ▼
imageStore.setGenerating(true)
      │
      ▼
geminiService.generateImage(model, prompt, aspectRatio, referenceImage?)
      │
      ├─► [if referenceImage] encode as base64 inlineData → inject into parts[]
      │
      ▼
@google/genai: ai.models.generateContent({ model, contents, config })
      │
      ▼
Extract inlineData from response.candidates[0].content.parts
      │
      ▼
Return "data:image/png;base64,{base64}" URI
      │
      ▼
imageStore.addImage(GeneratedImage)
      │
      ▼
ImageOutput renders image
```

### Video Generation Flow
```
User enters prompt + configures options
      │
      ▼
VideoControls.handleGenerate()
      │
      ▼
geminiService.generateVideo() → returns Operation (pending)
      │
      ▼
geminiService.pollVideoOperation(operation) [every 5s]
      │
      ▼
operation.done === true
      │
      ▼
fetch(videoUri, { headers: { 'x-goog-api-key': key } })
      │
      ▼
URL.createObjectURL(blob)
      │
      ▼
videoStore.addVideo(GeneratedVideo)
      │
      ▼
VideoOutput renders <video> player
```

### Style Profile Analysis Flow
```
User enters name + uploads images (≥5 required)
      │
      ▼
CreateProfile.handleAnalyze()
      │
      ▼
Simulated progress animation (10 steps × 800ms = ~8s to 80%)
      │
      ▼
geminiService.analyzeStyle(images.slice(0, 3))
      │
      ▼
Gemini multimodal: analyze faces → extract descriptor
      │
      ▼
styleStore.addProfile({ id, name, description, thumbnail, referenceImages })
      │
      ▼
navigate('/generate/image')
```

---

## 14. Pricing & Subscription Tiers

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| **Price (Monthly)** | $0 | $29/mo | $99/mo |
| **Price (Annual)** | $0 | $24/mo | $89/mo |
| Chat messages | 100/mo | Unlimited | Unlimited |
| Image generations | 20/mo | 1,000/mo | Unlimited |
| Video generations | ❌ | 50/mo | Unlimited |
| Generation speed | Standard | Fast | Fastest |
| Watermarks | ✅ (on images) | ❌ | ❌ |
| Private gallery | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Commercial usage | ❌ | ✅ | ✅ |
| Custom fine-tuning | ❌ | ❌ | ✅ |
| SSO / Team mgmt | ❌ | ❌ | ✅ |
| SLA guarantee | ❌ | ❌ | ✅ |
| Support | Community | Priority | Dedicated |

---

## 15. API Documentation (Built-in)

The `/docs` page documents the planned `api.neongen.ai` REST API. Current docs include:

### Authentication
```bash
curl https://api.neongen.ai/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Chat Completion
```javascript
POST https://api.neongen.ai/v1/chat/completions
{
  "model": "gemini-3-pro-preview",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```

### Image Generation
```javascript
POST https://api.neongen.ai/v1/images/generate
{
  "model": "gemini-3-pro-image-preview",
  "prompt": "A futuristic city with neon lights",
  "size": "1024x1024"
}
```

### Video Generation
```javascript
// via SDK:
const response = await neon.images.generate({
  model: 'gemini-3-pro-image-preview',
  prompt: 'A cyberpunk city with neon lights',
  size: '1024x1024',
  quality: 'hd'
});
```

---

## Appendix: localStorage Keys

| Key | Store | Contents |
|---|---|---|
| `neongen-chat-storage` | chatStore | All conversations and messages |
| `neongen-image-storage` | imageStore | Generated images (base64), prompt settings |
| `neongen-video-storage` | videoStore | Video metadata, prompt settings |
| `neongen-style-profiles` | styleStore | Style profile definitions |

> ⚠️ **Note:** Video Blob URLs (`URL.createObjectURL`) are NOT stored in localStorage and are lost on page refresh. The video metadata entry is stored, but the actual video file would need to be re-downloaded in a production implementation.

---

*Last updated: February 2026 | NeonGen v1.0.0*
