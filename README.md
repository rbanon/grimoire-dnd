# ⚔️ D&D Character Creator

A modern **Single Page Application (SPA)** for creating and managing Dungeons & Dragons 5e characters. Build your hero step by step, manage campaigns, and keep track of your spells and items.

[![Built with Vue 3](https://img.shields.io/badge/built%20with-Vue%203-4FC08D?style=flat-square&logo=vue.js)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)]()
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)]()
[![Supabase](https://img.shields.io/badge/Supabase-2.0-3ECF8E?style=flat-square&logo=supabase)]()

## ✨ Features

### 🧙 Character Builder
- Step-by-step character creation wizard
- Race, class, and background selection with picker cards
- Ability score input and alignment grid
- Full character review before saving

### 📋 Character Management
- List and detail views for all characters
- Persistent storage via Supabase

### 📜 Campaigns
- Create and manage D&D campaigns
- Campaign detail pages with associated characters

### 🔮 Spells & Items
- Spell browser for quick reference
- Item management per character

### 🔐 Authentication
- User login and profile management via Supabase Auth

### 🎨 Light/Dark Theme
- **Dark mode** by default (Grimoire-inspired style)
- **Light mode** with clean colors
- Color mode toggle in the header

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Framework** | Vue 3 + Composition API | Modern, reactive, performant |
| **Language** | TypeScript | Type-safe, better development |
| **Bundler** | Vite | Fast, current standard |
| **Styles** | UnoCSS | Utility-first, lightweight |
| **State** | Pinia | Vue-native state management |
| **Data** | TanStack Query v5 | Server state and caching |
| **Backend** | Supabase | Auth + database + real-time |
| **Validation** | Zod | Schema validation |
| **Router** | Vue Router v5 | Client-side navigation |

## 📦 Installation

### Requirements
- Node.js 18+
- npm or yarn

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/dnd-character-creator.git
cd dnd-character-creator

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

## 🚀 Usage

1. **Log in** with your account or register
2. **Create a character** using the step-by-step builder
3. **Choose race, class, background** and set ability scores
4. **Review and save** your character to your profile
5. **Manage campaigns** and link characters to adventures

## 📁 Project Structure

```
src/
├── app-shell/
│   ├── AppLayout.vue          # Main layout with nav and footer
│   ├── AppNav.vue             # Navigation bar
│   ├── AppFooter.vue          # Footer
│   └── ColorModeToggle.vue    # Theme switcher
├── auth/
│   ├── store.ts               # Auth state management
│   └── pages/                 # Login and profile pages
├── character-builder/
│   ├── builderStore.ts        # Builder wizard state
│   ├── classMeta.ts           # Class metadata
│   ├── components/            # Builder UI components
│   ├── steps/                 # Wizard step components
│   └── pages/                 # Builder page
├── characters/                # Character list and detail
├── campaigns/                 # Campaign CRUD
├── spells/                    # Spell browser
├── items/                     # Item management
├── shared/                    # Shared utilities and components
├── router/                    # Vue Router configuration
└── main.ts                    # Entry point
```

## 🎨 Themes

### Dark Mode (Default)
```scss
--bg-primary:     #0d1117
--text-primary:   #e6edf3
--accent:         #58a6ff
```

### Light Mode
```scss
--bg-primary:     #ffffff
--text-primary:   #1f2328
--accent:         #0969da
```

## 🚦 Available Scripts

```bash
npm run dev        # Start Vite server at http://localhost:5173
npm run build      # Build for production (dist/)
npm run preview    # Preview the build
npm run type-check # Check TypeScript types
npm run lint       # Run ESLint
npm run format     # Format with Prettier
```

## 🌍 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or simply connect the repo at [vercel.com](https://vercel.com)

## 📝 License

This project is under the MIT license. See [LICENSE](./LICENSE) for details.

## 👨‍💻 Author

Created by Rafael Bañón - Logo crateaad by Vecteezy

## 🐛 Issues & Support

Found a bug? [Open an issue](../../issues/new)

## 🙏 Acknowledgments

- [Vue 3](https://vuejs.org/)
- [Supabase](https://supabase.com/)
- [TanStack Query](https://tanstack.com/query)
- [UnoCSS](https://unocss.dev/)
- [Vite](https://vitejs.dev/)

---

**⭐ If you like the project, don't forget to leave a star!**

[Back to top ⬆️](#️-dd-character-creator)
