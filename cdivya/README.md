# cdivya — Divya's Creative Portfolio

A dark, immersive portfolio site for **Divya**, Creative Visual Designer & Photographer.  
Built with **Vite · Vanilla JS · CSS · anime.js**.

---

## ✦ What's inside

| Section | Status |
|---|---|
| Hero with particle constellation | ✅ |
| Services / What I Do | ✅ |
| Photo Gallery | 🔜 Connect Supabase |
| Video Repository | 🔜 Feed video URLs |
| Sliding Puzzle Game | ✅ |
| Runaway Buttons (Call Nishi / Call Jeffrey) | ✅ |
| Custom cursor | ✅ |
| Mobile responsive | ✅ |

---

## 🚀 Deploy via GitHub → Vercel

### 1. Create the GitHub repo
1. Go to [github.com/new](https://github.com/new)
2. Name it **`cdivya`** (private or public, your choice)
3. **Do not** initialise with a README (we have one)

### 2. Push these files
```bash
# In your local terminal (one time)
git init
git add .
git commit -m "Initial build — Divya's portfolio 🎨"
git remote add origin https://github.com/YOUR_USERNAME/cdivya.git
git branch -M main
git push -u origin main
```

### 3. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the `cdivya` GitHub repo
3. Vercel auto-detects Vite — just click **Deploy**
4. Done ✅ — every push to `main` auto-deploys

### 4. Connect your domain (GoDaddy → pocketprojects.in)
In your Vercel project → **Settings → Domains** → add `pocketprojects.in`  
Then in GoDaddy DNS, add:
```
Type: A       Name: @     Value: 76.76.21.21
Type: CNAME   Name: www   Value: cname.vercel-dns.com
```

---

## 🛠️ Local development (optional)

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 🗄️ Supabase integration (Gallery & Videos)

When ready:
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a table `gallery_items` with columns: `id, url, caption, order`
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel environment variables
4. Drop in `@supabase/supabase-js` and wire up the gallery grid

---

## 📁 File structure

```
cdivya/
├── index.html          ← All HTML / sections
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── src/
    ├── main.js         ← Entry point
    ├── style.css       ← All styles (CSS variables, animations, responsive)
    ├── cursor.js       ← Custom dot+ring cursor
    ├── nav.js          ← Scroll-aware nav + hamburger
    ├── particles.js    ← Hero canvas constellation
    ├── runaway.js      ← Call Nishi / Call Jeffrey buttons
    ├── puzzle.js       ← 15-tile sliding puzzle + confetti
    └── scroll-reveal.js← IntersectionObserver entrance animations
```

---

> Made with ✦ and a concerning amount of coffee.
