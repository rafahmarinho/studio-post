<div align="center">

# Studio Post

**AI-Powered Batch Creative Generator for Social Media**

Generate professional images and captions at scale using Google Gemini and OpenAI GPT.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)](https://firebase.google.com)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron)](https://www.electronjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Getting Started](#-getting-started) · [Features](#-features) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Electron Desktop](#-electron-desktop) · [Deploy](#-deploy) · [Contributing](#-contributing)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Firebase Setup](#firebase-setup)
  - [Running Locally](#running-locally)
- [Project Structure](#-project-structure)
- [Features in Detail](#-features-in-detail)
  - [Batch Image Generation](#1-batch-image-generation)
  - [Smart Caption Generation](#2-smart-caption-generation)
  - [Carousel Support](#3-carousel-support)
  - [Image Refinement (Versioning)](#4-image-refinement-versioning)
  - [AI Auto-Fill ("No Ideas?" Modal)](#5-ai-auto-fill-no-ideas-modal)
  - [AI Upscaling](#6-ai-upscaling-2x--4x)
  - [Background Removal](#7-intelligent-background-removal)
  - [Automatic Variations](#8-automatic-variations)
  - [Brand Kits](#9-brand-kits)
  - [Editable Templates](#10-editable-templates)
  - [Multi-Tenant Workspaces](#11-multi-tenant-workspaces)
  - [Public REST API](#12-public-rest-api)
  - [Performance Reports](#13-performance-reports)
  - [Real-Time Streaming](#14-real-time-streaming)
  - [Progressive Discounts](#15-progressive-discounts)
  - [Cost Control](#16-cost-control-dashboard)
- [Authentication & User Tiers](#-authentication--user-tiers)
- [Pricing Model](#-pricing-model)
- [API Reference](#-api-reference)
- [Electron Desktop App](#-electron-desktop-app)
  - [Development](#electron-development)
  - [Building](#electron-building)
  - [Auto-Updater](#auto-updater)
  - [Tray Icon](#tray-icon)
  - [Offline / Hybrid Mode](#offline--hybrid-mode)
- [Deploy](#-deploy)
  - [Vercel (Web)](#vercel-web)
  - [Electron Releases](#electron-releases)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## Overview

Studio Post is a full-stack system for **batch generation of social media creatives** powered by AI. A user fills out a detailed brief and the system automatically generates:

- **Images** — via Google Gemini (`gemini-2.0-flash-preview-image-generation`)
- **Captions** — via OpenAI GPT (`gpt-4.1-mini`)

It ships as both a **web application** (Next.js on Vercel) and a **desktop application** (Electron for Windows, macOS, Linux).

---

## ✨ Features

| Feature | Description |
|---|---|
| **Batch generation** | 1–30 images per run with automatic style variation (30 strategies) |
| **Smart captions** | Professional copy with headline, body, CTA, and hashtags (6 copy strategies) |
| **Carousel** | Native support with visual storytelling (HOOK → CONTENT → CTA) |
| **Refinement** | Edit generated images via multimodal prompt (versioning: v2, v3…) |
| **"No Ideas?"** | AI fills the entire form from a free-text description |
| **AI Upscaling** | Enlarge images 2× or 4× via Gemini super-resolution |
| **Background Removal** | Intelligent background removal to PNG/WebP |
| **Auto-Variations** | Generate up to 5 variants of any image with adjustable strength |
| **Brand Kits** | Save brand colors, fonts, tone, style — auto-apply to generations |
| **Templates** | Reusable generation presets organized by category |
| **Multi-tenant** | Workspaces with member roles, per-tenant settings, custom limits |
| **Public API** | REST API with key-based auth, per-key permissions, rate limiting |
| **Reports** | Performance analytics with daily breakdown, platform stats, cost analysis |
| **Streaming** | Images appear in real time as they are generated |
| **Multi-platform** | Optimized formats for Instagram, Facebook, LinkedIn, TikTok, YouTube, etc. |
| **Progressive discounts** | 5%–30% off for batches of 6–30 items |
| **Cost control** | Admin cost dashboard with per-user breakdown |
| **3 usage modes** | Own API keys / Free tier (5/day) / Pay-per-batch |
| **Cross-platform desktop** | Electron app with tray icon, auto-update, offline mode |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js / Electron)               │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Briefing │  │  Streaming   │  │  Modal Image + Refine │ │
│  │   Form   │  │     Grid     │  │  (zoom/pan/versions)  │ │
│  └─────┬────┘  └──────┬───────┘  └──────────┬────────────┘ │
│        └───────────────┼─────────────────────┘              │
│                ┌───────▼──────────┐                         │
│                │  useCreative()   │  (state + orchestration)│
│                └───────┬──────────┘                         │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP (fetch)
┌────────────────────────▼────────────────────────────────────┐
│                     API ROUTES (Next.js)                    │
│                                                             │
│  /api/creative/generate    → Google Gemini (images)         │
│  /api/creative/captions    → OpenAI GPT (captions)          │
│  /api/creative/refine      → Gemini multimodal              │
│  /api/creative/idea        → GPT auto-fill                  │
│  /api/creative/upscale     → Gemini super-resolution        │
│  /api/creative/remove-background → Gemini segmentation      │
│  /api/creative/variations  → Gemini guided variations       │
│  /api/v1/*                 → Public REST API                │
│  /api/brand-kits           → Brand kit CRUD                 │
│  /api/templates            → Template CRUD                  │
│  /api/tenants              → Workspace management           │
│  /api/api-keys             → API key management             │
│  /api/reports              → Performance analytics          │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
  ┌────────▼────────┐       ┌────────▼────────┐
  │    Firestore    │       │ Firebase Storage │
  │     (data)      │       │    (images)      │
  └─────────────────┘       └─────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | `'use client'` + Server Components |
| **Language** | TypeScript 5 | Strict mode |
| **UI** | shadcn/ui + Radix UI | Accessible, composable components |
| **Icons** | lucide-react | Modern SVG icons |
| **Styling** | Tailwind CSS 4 | Utility-first |
| **Auth** | Firebase Authentication | Google OAuth + Email/Password |
| **Database** | Cloud Firestore | NoSQL, real-time |
| **Storage** | Firebase Storage | Image uploads with public URLs |
| **AI – Images** | Google Gemini API | `gemini-2.0-flash-preview-image-generation` |
| **AI – Text** | OpenAI API | `gpt-4.1-mini` (temperature 0.7–0.9) |
| **Desktop** | Electron | Cross-platform with auto-updater |
| **Deploy** | Vercel | `maxDuration: 300` (5 min timeout) |
| **Package Manager** | pnpm | Workspace monorepo |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| **Node.js** | 18.17 or later |
| **pnpm** | 8.0 or later |
| **Git** | Any recent version |

You will also need:
- A **Firebase project** (free Spark plan works for development)
- A **Google AI API key** for Gemini (get one at [aistudio.google.com](https://aistudio.google.com))
- An **OpenAI API key** (get one at [platform.openai.com](https://platform.openai.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/studio-post.git
cd studio-post

# Install dependencies
pnpm install
```

### Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure:

```env
# ──────────────────────────────────────────────
# Firebase Client SDK (exposed to browser)
# Get these from Firebase Console → Project Settings → Your Apps → Web
# ──────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# ──────────────────────────────────────────────
# Firebase Admin SDK (server-side only, never exposed)
# Get these from Firebase Console → Project Settings → Service Accounts → Generate new private key
# ──────────────────────────────────────────────
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# ──────────────────────────────────────────────
# AI APIs (server-side — used for free/paid tiers)
# Users on "own_keys" tier will use their own keys instead
# ──────────────────────────────────────────────
GEMINI_API_KEY=AIza...
OPEN_API_KEY=sk-...

# ──────────────────────────────────────────────
# Optional: Stripe (only needed if enabling paid tier)
# ──────────────────────────────────────────────
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

```

### Firebase Setup

#### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it → disable Google Analytics (optional)
3. Wait for provisioning

#### 2. Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** (enter your project's public-facing name and support email)
3. Enable **Email/Password**

#### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Select production mode (we'll set rules next)
3. Choose the closest region

#### 4. Firestore Security Rules

Go to **Firestore Database** → **Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection: users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Generations: users can CRUD their own generations
    match /creative_generations/{docId} {
      allow read, write: if request.auth != null
        && resource == null || resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }

    // Costs: users can read their own; admins can read all (enforced server-side)
    match /creative_costs/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Brand Kits
    match /brand_kits/{docId} {
      allow read, write: if request.auth != null
        && (resource == null || resource.data.userId == request.auth.uid);
      allow create: if request.auth != null;
    }

    // Templates: public ones are readable by all authed users
    match /creative_templates/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && (resource == null || resource.data.userId == request.auth.uid);
      allow create: if request.auth != null;
    }

    // Tenants
    match /tenants/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // API Keys
    match /api_keys/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 5. Enable Firebase Storage

1. Go to **Storage** → **Get started**
2. Set storage rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /creative/{allPaths=**} {
      allow read: if true;  // Public read for generated images
      allow write: if request.auth != null;
    }
    match /logos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /references/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

#### 6. Get Admin SDK Credentials

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Open the downloaded JSON and copy `project_id`, `client_email`, and `private_key` to your `.env.local`

#### 7. Recommended Firestore Indexes

Create these composite indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Order |
|---|---|---|
| `creative_generations` | `userId` ASC, `createdAt` DESC | Composite |
| `creative_generations` | `clientId` ASC, `createdAt` DESC | Composite |
| `creative_costs` | `userId` ASC, `createdAt` DESC | Composite |
| `creative_costs` | `createdAt` DESC | Single field |
| `brand_kits` | `userId` ASC, `createdAt` DESC | Composite |
| `creative_templates` | `isPublic` ASC, `createdAt` DESC | Composite |

> Firebase will also automatically prompt you to create indexes when queries require them during development.

### Running Locally

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

**Other useful commands:**

```bash
# Type-check the project
pnpm build

# Run ESLint
pnpm lint
```

---

## 📁 Project Structure

```
studio-post/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (AuthProvider + Toaster)
│   │   ├── page.tsx                      # Landing page
│   │   ├── globals.css                   # Tailwind + shadcn/ui theme
│   │   │
│   │   ├── api/                          # Backend API Routes
│   │   │   ├── creative/
│   │   │   │   ├── generate/route.ts     # Gemini image generation
│   │   │   │   ├── captions/route.ts     # OpenAI caption generation
│   │   │   │   ├── refine/route.ts       # Multimodal image refinement
│   │   │   │   ├── idea/route.ts         # AI form auto-fill
│   │   │   │   ├── upscale/route.ts      # Image upscaling (2x/4x)
│   │   │   │   ├── remove-background/route.ts  # BG removal
│   │   │   │   └── variations/route.ts   # Auto-variations
│   │   │   ├── brand-kits/route.ts       # Brand kit CRUD
│   │   │   ├── templates/route.ts        # Template CRUD
│   │   │   ├── tenants/route.ts          # Workspace/tenant management
│   │   │   ├── api-keys/route.ts         # API key management
│   │   │   ├── reports/route.ts          # Performance analytics
│   │   │   └── v1/route.ts              # Public REST API gateway
│   │   │
│   │   ├── (auth)/                       # Auth group routes
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   └── dashboard/                    # Authenticated area
│   │       ├── layout.tsx                # Sidebar + navigation
│   │       ├── page.tsx                  # Dashboard home (stats)
│   │       ├── generate/page.tsx         # Generation form + results
│   │       ├── history/page.tsx          # Generation history
│   │       ├── costs/page.tsx            # Cost dashboard (admin)
│   │       ├── settings/page.tsx         # Profile + API keys
│   │       ├── brand-kits/page.tsx       # Brand kit manager
│   │       ├── templates/page.tsx        # Template browser
│   │       ├── workspace/page.tsx        # Multi-tenant management
│   │       └── reports/page.tsx          # Performance analytics
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui base components
│   │   │   ├── badge.tsx, button.tsx, card.tsx, checkbox.tsx,
│   │   │   │   dialog.tsx, input.tsx, label.tsx, progress.tsx,
│   │   │   │   select.tsx, slider.tsx, tabs.tsx, textarea.tsx
│   │   └── shared/                       # Application components
│   │       ├── image-modal.tsx           # Zoom/pan/refine modal
│   │       ├── streaming-grid.tsx        # Real-time generation grid
│   │       ├── results-grid.tsx          # Final results grid
│   │       ├── carousel-viewer.tsx       # Carousel slide viewer
│   │       ├── caption-card.tsx          # Caption display card
│   │       ├── pricing-panel.tsx         # Sidebar pricing panel
│   │       └── idea-modal.tsx            # "No ideas?" AI modal
│   │
│   ├── hooks/
│   │   └── use-creative.ts              # Main orchestration hook
│   │
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase client config
│   │   ├── firebase-admin.ts             # Firebase Admin SDK
│   │   ├── auth-context.tsx              # Auth context provider
│   │   ├── creative-service.ts           # Firestore CRUD layer
│   │   ├── constants.ts                  # Pricing, strategies, config
│   │   └── utils.ts                      # Utilities (cn, formatCurrency)
│   │
│   └── types/
│       └── index.ts                      # All TypeScript types & enums
│
├── electron/                             # Electron desktop app
│   ├── main.ts                           # Main process (window, tray, IPC)
│   ├── preload.ts                        # Context bridge (secure IPC)
│   └── local-server.ts                   # Express-like HTTP server for offline
│
├── build/                                # Electron build resources
│   └── entitlements.mac.plist            # macOS code signing
│
├── public/                               # Static assets
├── .env.example                          # Environment variable template
├── electron-builder.yml                  # Electron build configuration
├── next.config.ts                        # Next.js configuration
├── tsconfig.json                         # TypeScript configuration
├── eslint.config.mjs                     # ESLint configuration
├── postcss.config.mjs                    # PostCSS (Tailwind) config
├── vercel.json                           # Vercel deployment config
├── pnpm-workspace.yaml                   # pnpm workspace config
└── package.json
```

---

## 📋 Features in Detail

### 1. Batch Image Generation

Generate 1–30 images in a single session. Each image gets a unique variation strategy (30 total) to ensure visual diversity.

**How it works:**
1. Fill out the creative brief (platform, format, style, tone, etc.)
2. Choose how many images to generate (1–30)
3. The system calls Gemini once per image with a unique variation strategy
4. Images stream to your screen in real time as they complete
5. All images are uploaded to Firebase Storage and URLs saved to Firestore

**API Route:** `POST /api/creative/generate`

**Supported formats per platform:**

| Platform | Feed | Stories | Carousel | Landscape | Portrait | Wide |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Instagram | ✅ | ✅ | ✅ | | ✅ | |
| Facebook | ✅ | ✅ | | ✅ | | ✅ |
| LinkedIn | ✅ | | | ✅ | | ✅ |
| TikTok | | ✅ | | | ✅ | |
| YouTube | | | | ✅ | | ✅ |
| X (Twitter) | ✅ | | | ✅ | | |
| Pinterest | | ✅ | | | ✅ | |

### 2. Smart Caption Generation

Captions are generated via OpenAI GPT with 6 rotating copy strategies:

| # | Strategy | Description |
|---|---|---|
| 1 | **Storytelling** | Engaging micro-story |
| 2 | **Provocative question** | Curiosity-driven hook |
| 3 | **Impactful data** | Surprising fact or stat |
| 4 | **Direct benefit** | Clear value proposition |
| 5 | **Social proof** | Testimonial/authority angle |
| 6 | **Natural urgency** | Subtle FOMO (no aggressive pressure) |

Each caption includes:
- **Headline** — Irresistible hook (≤80 chars)
- **Body** — Storytelling with relevant emojis
- **CTA** — Clear call-to-action
- **Hashtags** — 5–10 relevant hashtags

**API Route:** `POST /api/creative/captions`

### 3. Carousel Support

Carousels maintain visual consistency across slides with narrative roles:

| Slide Position | Role | Content |
|---|---|---|
| First slide | **HOOK/COVER** | Maximum-impact visual to stop the scroll |
| Middle slides | **CONTENT** | Development with data, examples, steps |
| Last slide | **CTA** | Clear visual call-to-action |

**Configuration:**
- Number of carousels: 1–30
- Slides per carousel: 2–10
- 1 caption per carousel (not per slide)
- Consistency enforced: same palette, typography, margins, grid

### 4. Image Refinement (Versioning)

Edit any generated image via multimodal prompt. The system sends the original image + your text instruction to Gemini.

**How it works:**
1. Open any image in the zoom modal
2. Type a refinement instruction (e.g., "Change background to blue")
3. Gemini receives both the image and your text
4. A new version is created (v2, v3…) — originals are never overwritten
5. Version badge appears on the grid

**Storage path:** `creative/{generationId}/{index}_v{version}.{ext}`

**Cost:** R$ 0.99 per refinement (fixed, no discount)

**API Route:** `POST /api/creative/refine`

### 5. AI Auto-Fill ("No Ideas?" Modal)

Describe what you need in free text and the AI fills every field in the form.

**How it works:**
1. Click the "No Ideas?" button at the top of the form
2. Describe your need in natural language (min. 10 chars)
3. GPT analyzes your description and returns a complete creative brief
4. All form fields are populated automatically
5. Review and adjust before generating

The AI doesn't copy your input literally — it generates a professional brief with optimal settings for the detected use case.

**API Route:** `POST /api/creative/idea`

### 6. AI Upscaling (2× & 4×)

Enlarge any generated image using Gemini's super-resolution capabilities.

**How it works:**
1. Open an image in the modal
2. Choose 2× or 4× upscale
3. Gemini enhances the image while preserving details
4. Result is saved as a new version

**API Route:** `POST /api/creative/upscale`

### 7. Intelligent Background Removal

Remove the background from any image, outputting PNG (with transparency) or WebP.

**How it works:**
1. Open an image in the modal
2. Click "Remove Background"
3. Gemini segments the subject from the background
4. Clean PNG/WebP with transparent background is generated

**API Route:** `POST /api/creative/remove-background`

### 8. Automatic Variations

Generate up to 5 visual variants of any image with adjustable similarity.

**How it works:**
1. Select an image and click "Generate Variations"
2. Choose count (1–5) and strength (0.3 = subtle → 0.9 = very different)
3. Gemini generates variations maintaining the original's essence
4. All variants are saved and displayed

**API Route:** `POST /api/creative/variations`

### 9. Brand Kits

Save your brand's visual identity and auto-apply it to every generation.

**A brand kit includes:**
- **Colors** — Named colors with roles (primary, secondary, accent, background, text)
- **Fonts** — Named fonts with roles (heading, body, accent)
- **Tone** — Default communication tone
- **Visual Style** — Default visual style
- **Mood** — Default mood/atmosphere
- **Platform & Format** — Default platform and image format
- **Guidelines** — Free-text brand guidelines

**Dashboard:** `/dashboard/brand-kits`

### 10. Editable Templates

Save and reuse generation presets. Templates can be private or shared publicly.

**Features:**
- 10 categories: Social Media, E-commerce, Events, Seasonal, Corporate, Food, Fashion, Tech, Education, Custom
- Link to a Brand Kit for automatic style application
- Duplicate any template as a starting point
- Track usage count
- Public/private toggle

**Dashboard:** `/dashboard/templates`

### 11. Multi-Tenant Workspaces

Create isolated workspaces for teams, clients, or different brands.

**Plans:**

| Feature | Starter | Professional | Enterprise |
|---|---|---|---|
| Members | 3 | 10 | Unlimited |
| Daily images | 50 | 200 | Unlimited |
| Brand kits | 2 | 10 | Unlimited |
| Templates | 10 | 50 | Unlimited |
| API access | ❌ | ✅ | ✅ |

**Member roles:** Owner, Admin, Editor, Viewer

**Workspace settings:**
- Allow members to use own API keys
- Default tier for new members
- Custom daily spending limit
- Custom watermark
- Webhook URL for event notifications

**Dashboard:** `/dashboard/workspace`

### 12. Public REST API

Programmatic access to Studio Post for external integrations.

**Endpoint:** `POST /api/v1`

**Authentication:** API key in `Authorization: Bearer sp_live_...` header

**Available actions:**

| Action | Required Permission | Description |
|---|---|---|
| `generate.images` | `generate:images` | Generate images from a brief |
| `generate.captions` | `generate:captions` | Generate captions |
| `generate.refine` | `generate:refine` | Refine an existing image |
| `generate.upscale` | `generate:upscale` | Upscale an image |
| `generate.variations` | `generate:variations` | Generate variations |
| `generate.remove_bg` | `generate:remove_bg` | Remove background |
| `list.generations` | `read:generations` | List past generations |
| `list.costs` | `read:costs` | List cost records |

**Example request:**

```bash
curl -X POST https://your-app.vercel.app/api/v1 \
  -H "Authorization: Bearer sp_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate.images",
    "params": {
      "context": "Promotional post for a coffee shop",
      "platform": "instagram",
      "imageFormat": "feed",
      "tone": "friendly",
      "totalImages": 3,
      "generationMode": "both"
    }
  }'
```

**Self-documenting:** `GET /api/v1` returns the full API documentation as JSON.

**API Key management dashboard:** `/dashboard/workspace` → API Keys section

### 13. Performance Reports

Analytics dashboard with metrics, charts, and breakdowns.

**Includes:**
- Summary cards: total generations, images, cost, success rate
- Daily activity chart (generations + cost over time)
- Platform usage breakdown (bar chart)
- Format usage breakdown (bar chart)
- Cost analysis: revenue, API cost, margin, avg. revenue per user
- Filter by period: 7 days, 30 days, 90 days, or custom range

**API Route:** `GET /api/reports?period=30d`

**Dashboard:** `/dashboard/reports`

### 14. Real-Time Streaming

During generation, images appear on screen the moment they're ready. No waiting for the entire batch.

**How it works:**
- Each image is an independent API call
- As soon as one succeeds, the URL is pushed to a React state array
- The streaming grid shows completed images + animated skeleton placeholders
- Progress bar updates in real time
- `beforeunload` event prevents accidental page close during generation

### 15. Progressive Discounts

Larger batches automatically get discounted:

| Quantity | Discount | Price/Image | Price/Caption | Price/Both |
|---|---|---|---|---|
| 1–5 | 0% | R$ 3.00 | R$ 1.00 | R$ 3.50 |
| 6 | 5% | R$ 2.85 | R$ 0.95 | R$ 3.33 |
| 10 | ~12% | R$ 2.65 | R$ 0.88 | R$ 3.09 |
| 15 | ~19% | R$ 2.44 | R$ 0.81 | R$ 2.84 |
| 20 | ~25% | R$ 2.25 | R$ 0.75 | R$ 2.63 |
| 25 | ~28% | R$ 2.16 | R$ 0.72 | R$ 2.52 |
| 30 | 30% | R$ 2.10 | R$ 0.70 | R$ 2.45 |

**Formula:** `discount = 0.05 + ((clamp(qty, 6, 30) - 6) / 24) × 0.25`

### 16. Cost Control Dashboard

Admin-only page showing all spending across the platform.

**Features:**
- Total spent, total images, active clients
- Per-user breakdown with expandable transaction table
- Date filtering
- BRL formatting

**Dashboard:** `/dashboard/costs`

---

## 🔐 Authentication & User Tiers

### Login Methods

| Method | Details |
|---|---|
| **Google** | OAuth 2.0 via Firebase (`signInWithPopup`) |
| **Email/Password** | `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` |

### User Tiers

| Tier | Description | Cost to User | Cost to You |
|---|---|---|---|
| **own_keys** | User provides their own Gemini/OpenAI API keys | Only API provider cost | Zero |
| **paid** | Pay per batch, progressive discounts, unlimited usage | Per-batch pricing | Your API key |

### Role-Based Access

| Role | Generate | View Costs | Manage Users |
|---|---|---|---|
| **admin** | ✅ Unlimited | ✅ | ✅ |
| **user** | ✅ Per tier | ❌ | ❌ |

---

## 💰 Pricing Model

### Base Prices (per unit)

| Mode | Price |
|---|---|
| Images only | R$ 3.00 |
| Captions only | R$ 1.00 |
| Images + Captions | R$ 3.50 |
| Refinement | R$ 0.99 (fixed) |

### Actual API Costs (reference)

| Operation | Estimated Cost |
|---|---|
| 1 image (Gemini) | ~$0.005–$0.01 |
| 1 caption (GPT) | ~$0.001–$0.002 |
| 1 refinement (Gemini multimodal) | ~$0.008–$0.015 |
| Batch of 10 images + captions | ~$0.06–$0.12 |
| Batch of 30 images + captions | ~$0.18–$0.36 |

> With a selling price of R$ 3.00/image and API cost of ~R$ 0.05/image, margin is ~98%.

---

## 📡 API Reference

All API routes run with `maxDuration: 300` (5 minutes) on Vercel.

### Creative Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/creative/generate` | Generate a single image (called in loop) |
| `POST` | `/api/creative/captions` | Generate captions for a batch |
| `POST` | `/api/creative/refine` | Refine an image with multimodal prompt |
| `POST` | `/api/creative/idea` | AI auto-fill the creative brief form |
| `POST` | `/api/creative/upscale` | Upscale an image (2× or 4×) |
| `POST` | `/api/creative/remove-background` | Remove image background |
| `POST` | `/api/creative/variations` | Generate image variations |

### Management Routes

| Method | Route | Description |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/brand-kits` | Brand kit CRUD |
| `GET/POST/PUT/DELETE` | `/api/templates` | Template CRUD |
| `GET/POST/PUT/DELETE` | `/api/tenants` | Tenant/workspace management |
| `GET/POST/PUT/DELETE` | `/api/api-keys` | API key management |
| `GET` | `/api/reports` | Performance reports |

### Public API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1` | API documentation (self-describing) |
| `POST` | `/api/v1` | Execute API actions (key required) |

---

## 🖥 Electron Desktop App

The same Next.js application runs as a native desktop app via Electron.

### Electron Development

> **Note:** Electron requires additional dev dependencies that aren't installed by default. Install them before running:

```bash
# Install Electron dev dependencies
pnpm add -D electron electron-builder electron-updater

# Run Next.js dev server (terminal 1)
pnpm dev

# Run Electron pointing to localhost:3000 (terminal 2)
npx electron electron/main.ts
```

For a smoother experience, add these scripts to `package.json`:

```json
{
  "scripts": {
    "electron:dev": "electron electron/main.ts",
    "electron:build": "next build && electron-builder",
    "electron:build:win": "next build && electron-builder --win",
    "electron:build:mac": "next build && electron-builder --mac",
    "electron:build:linux": "next build && electron-builder --linux"
  }
}
```

### Electron Building

Build targets are configured in `electron-builder.yml`:

```bash
# Build for current platform
pnpm electron:build

# Build for specific platforms
pnpm electron:build:win      # Windows: .exe (NSIS installer) + portable
pnpm electron:build:mac      # macOS: .dmg + .zip (x64 + arm64)
pnpm electron:build:linux    # Linux: .AppImage + .deb + .rpm
```

**Output:** `dist/` directory

**Build configuration highlights:**
- ASAR packaging enabled with maximum compression
- Windows: NSIS installer (customizable install directory) + portable
- macOS: Hardened runtime + notarization-ready entitlements
- Linux: AppImage (universal), .deb (Debian/Ubuntu), .rpm (Fedora/RHEL)
- Code signing support for all platforms

### Auto-Updater

The app auto-checks for updates via GitHub Releases:

1. When a new version is available, a dialog asks the user to download
2. Download progress is shown in the taskbar/dock progress bar
3. Once downloaded, a dialog offers to restart and install
4. On next quit, the update is applied automatically

**Configuration** (in `electron-builder.yml`):

```yaml
publish:
  provider: github
  owner: ${GH_OWNER:-studiopost}
  repo: ${GH_REPO:-studio-post}
  releaseType: release
```

**To publish an update:**

```bash
# Bump version
npm version patch  # or minor/major

# Build and publish to GitHub Releases
GH_TOKEN=ghp_xxx pnpm electron:build --publish always
```

### Tray Icon

The app minimizes to system tray instead of closing:

- **Double-click tray icon** → Restore window
- **Right-click tray icon** → Context menu:
  - Open Studio Post
  - Generate Creatives (navigates to /dashboard/generate)
  - History (navigates to /dashboard/history)
  - Check for Updates
  - Quit

### Offline / Hybrid Mode

The Electron app includes a built-in HTTP server (`electron/local-server.ts`) that mirrors the Next.js API routes locally.

| Mode | API Target | Storage | Auth |
|---|---|---|---|
| **Online** | Vercel (cloud) | Firebase Storage | Firebase Auth |
| **Hybrid** | Local server (port 3099) | Local + Firebase | Firebase Auth |

**Local server supports:**
- `/api/creative/generate` — Image generation via Gemini
- `/api/creative/captions` — Caption generation via OpenAI
- `/api/creative/refine` — Image refinement
- `/api/creative/idea` — AI auto-fill
- `/api/creative/upscale` — Image upscaling
- `/api/creative/remove-background` — Background removal
- `/api/creative/variations` — Image variations

In local mode, users must provide their own API keys. Images are returned as base64 (no Firebase upload required).

**To start the local server** in the Electron main process:

```typescript
import { startLocalServer } from './local-server'
startLocalServer() // Starts on port 3099
```

---

## ☁️ Deploy

### Vercel (Web)

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new), import the repository
3. Set all environment variables from `.env.example`
4. Deploy

**Important:** The `vercel.json` sets `maxDuration: 300` (5 minutes) for API routes. This requires a **Vercel Pro plan** or higher.

```json
{
  "functions": {
    "maxDuration": 300
  }
}
```

**Custom domain:** Configure in Vercel Dashboard → Settings → Domains.

### Electron Releases

Releases are published to GitHub Releases and automatically picked up by the auto-updater.

```bash
# 1. Bump version
npm version patch

# 2. Build for all platforms
GH_TOKEN=ghp_xxx electron-builder --publish always

# 3. Releases appear at github.com/your-org/studio-post/releases
```

For CI/CD, use GitHub Actions:

```yaml
# .github/workflows/electron-release.yml
name: Electron Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - name: Build Electron
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx electron-builder --publish always
```

---

## 🗄 Database Schema

### Firestore Collections

#### `creative_generations`

| Field | Type | Description |
|---|---|---|
| `userId` | string | User UID |
| `userName` | string | User display name |
| `platform` | string | Content platform |
| `imageFormat` | string | Image format |
| `context` | string | Creative brief (min. 20 chars) |
| `purpose` | string | Objective |
| `intent` | string | Intent |
| `tone` | string | Communication tone |
| `visualStyle` | string | Visual style |
| `imageElements` | string[] | Image elements |
| `scenario` | string | Scene type |
| `mood` | string | Atmosphere |
| `lighting` | string | Lighting type |
| `background` | string | Background type |
| `totalImages` | number | Images requested (1–30) |
| `generationMode` | string | images_only / captions_only / both |
| `generatedImageUrls` | string[] | Generated image URLs |
| `generatedCaptions` | object[] | Generated captions |
| `imageVersions` | map | Version URLs per image index |
| `status` | string | pending / generating / completed / failed |
| `costPerImage` | number | Unit cost (cents) |
| `totalCost` | number | Total cost (cents) |
| `createdAt` | timestamp | Creation date |
| `updatedAt` | timestamp | Last update |

#### `creative_costs`

| Field | Type | Description |
|---|---|---|
| `userId` | string | User UID |
| `generationId` | string | Reference to generation |
| `imageCount` | number | Number of images |
| `costPerImage` | number | Unit cost (cents) |
| `totalCost` | number | Total cost (cents) |
| `type` | string | generation / refinement |
| `createdAt` | timestamp | Transaction date |

#### `users`

| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `email` | string | Email |
| `displayName` | string | Display name |
| `role` | string | admin / user |
| `tier` | string | free / own_keys / paid |
| `apiKeys` | map | Encrypted API keys (if own_keys tier) |
| `dailyGenerations` | number | Daily image counter (free tier) |
| `dailyRefinements` | number | Daily refinement counter (free tier) |
| `lastGenerationDate` | string | YYYY-MM-DD |

#### `brand_kits`

| Field | Type | Description |
|---|---|---|
| `userId` | string | Owner UID |
| `name` | string | Brand kit name |
| `colors` | object[] | Brand colors with name, hex, role |
| `fonts` | object[] | Brand fonts with name, role |
| `tone` | string | Default tone |
| `visualStyle` | string | Default visual style |
| `guidelines` | string | Free-text brand guidelines |

#### `creative_templates`

| Field | Type | Description |
|---|---|---|
| `userId` | string | Creator UID |
| `name` | string | Template name |
| `category` | string | Template category |
| `isPublic` | boolean | Visible to all users |
| `fields` | map | Partial creative brief data |
| `brandKitId` | string | Optional linked brand kit |
| `usageCount` | number | Times used |

#### `tenants`

| Field | Type | Description |
|---|---|---|
| `name` | string | Workspace name |
| `slug` | string | Unique identifier |
| `ownerId` | string | Owner UID |
| `plan` | string | starter / professional / enterprise |
| `settings` | map | Workspace settings |
| `members` | object[] | Members with roles |

#### `api_keys`

| Field | Type | Description |
|---|---|---|
| `tenantId` | string | Owning tenant |
| `name` | string | Key name/label |
| `keyPrefix` | string | First 8 chars (display) |
| `keyHash` | string | SHA-256 hash of full key |
| `permissions` | string[] | Allowed actions |
| `rateLimit` | number | Requests per minute |

---

## 🛡 Security

| Aspect | Implementation |
|---|---|
| **System API keys** | Server-side only env vars (never exposed to client) |
| **User API keys** | Encrypted in Firestore (BYO keys tier) |
| **Authentication** | Firebase Auth with JWT tokens validated server-side |
| **Authorization** | Firestore rules + server-side role checks |
| **Rate limiting** | Daily spend limit per user + retry with backoff on external APIs |
| **API keys** | SHA-256 hashed, per-key permissions, per-key rate limits |
| **File uploads** | MIME type validation + size limits |
| **Input sanitization** | All inputs sanitized before sending to AI models |
| **CORS** | Configured for authorized domains only |
| **Electron** | Context isolation enabled, node integration disabled, sandbox mode |
| **macOS** | Hardened runtime + notarization entitlements |
| **Single instance** | Electron enforces single app instance |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/my-feature`
3. **Make your changes** and ensure the project builds: `pnpm build`
4. **Run linting:** `pnpm lint`
5. **Commit** using conventional commits: `git commit -m "feat: add new feature"`
6. **Push** to your fork: `git push origin feature/my-feature`
7. **Open a Pull Request** against `main`

### Development Guidelines

- **TypeScript strict mode** — no `any` types unless absolutely necessary
- **App Router** — use `'use client'` directive only in client components
- **shadcn/ui** — use existing components from `src/components/ui/` before adding new ones
- **Tailwind CSS** — utility-first, avoid custom CSS
- **Firestore** — all CRUD goes through `src/lib/creative-service.ts`
- **State management** — use the `useCreative()` hook for generation logic
- **Naming** — PascalCase for components, camelCase for functions/variables, kebab-case for files

### Commit Convention

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting (no code change) |
| `refactor:` | Code refactoring |
| `perf:` | Performance improvement |
| `test:` | Tests |
| `chore:` | Build, CI, dependencies |

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

```
MIT License

Copyright (c) 2025 Studio Post Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
