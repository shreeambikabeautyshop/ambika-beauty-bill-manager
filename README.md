# 🧴 Ambika Beauty Bill Manager

> Smart cosmetic wholesale bill analyzer for **Shree Ambika Beauty Shop** — AI-powered bill scanning, price margin verification, product search, and date-wise bill history.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Bill Upload** | Upload PDF or image — AI extracts all products automatically |
| ✅ **Bill Verify** | Upload any bill image → AI checks every discount% and amount for errors |
| 🔍 **Product Search** | Search by name with AI suggestions (Groq) or upload product photo |
| 📦 **Product Database** | Full sortable/filterable product table from all bills |
| 📅 **Bill History** | Date-wise archive with Cloudinary image storage |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Cloudinary (date-wise folder structure)
- **AI Vision**: Google Gemini 1.5 Flash
- **AI Text**: Groq (LLaMA 3.3 70B)
- **UI**: Tailwind CSS + Framer Motion
- **Mobile**: Capacitor.js (Web → Android APK)

---

## 🚀 Setup

### 1. Clone & Install
```bash
git clone https://github.com/shreeambikabeautyshop/ambika-beauty-bill-manager
cd ambika-beauty-bill-manager
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in your keys in .env.local
```

### 3. Supabase Database
- Open your Supabase project → SQL Editor
- Run `supabase-schema.sql` (copy-paste and execute)

### 4. Cloudinary Upload Preset
- Go to Cloudinary → Settings → Upload Presets
- Create preset named `ambika_bills` (unsigned)

### 5. Run
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📱 Convert to Android APK

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
# Build APK from Android Studio
```

---

## 📁 Project Structure

```
ambika-beauty-bill-manager/
├── app/
│   ├── (dashboard)/
│   │   ├── bills/        # Upload & analyze bills
│   │   ├── verify/       # Price verification
│   │   ├── search/       # Product search
│   │   ├── products/     # All products table
│   │   └── history/      # Date-wise bill archive
│   └── api/
│       ├── analyze-bill/ # Extract + save bill
│       ├── verify-bill/  # Verify prices
│       ├── search/       # Product search API
│       └── image-search/ # Product image recognition
├── components/
├── lib/                  # Supabase, Cloudinary, Gemini, Groq
├── types/
└── supabase-schema.sql
```

---

## 🔑 Required API Keys

| Service | Where to get |
|---------|-------------|
| Supabase URL + Anon Key | supabase.com → Project Settings → API |
| Supabase Service Role Key | supabase.com → Project Settings → API |
| Cloudinary Cloud Name + Keys | cloudinary.com → Dashboard |
| Gemini API Key | aistudio.google.com |
| Groq API Key | console.groq.com |
