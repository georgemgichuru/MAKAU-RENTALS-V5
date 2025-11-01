# Quick Start Guide

Welcome to your new Makau Rentals landing page! 🎉

## What's Included

✅ Beautiful, responsive landing page  
✅ SEO-optimized with metadata, Open Graph, sitemap  
✅ Contact form (needs backend integration)  
✅ Pricing section  
✅ Terms & Conditions page  
✅ Tailwind CSS for styling  
✅ TypeScript for type safety  

## Run the Project

The dev server is already running at **http://localhost:3000**

If you need to start it again:

```bash
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Landing Page\makau-landing"
npm run dev
```

## View Your Landing Page

Open your browser to: **http://localhost:3000**

You'll see:
- **Home page** with hero, features, and pricing
- **Contact page** at `/contact`
- **Terms** at `/terms`

## Next Steps

### 1. Customize Content

**Update contact information:**
- `src/components/Footer.tsx` - Update email and phone
- `src/app/contact/page.tsx` - Update email

**Update pricing:**
- `src/app/page.tsx` - Edit the PricingCard components

**Update SEO metadata:**
- `src/app/layout.tsx` - Change URLs from `https://example.com` to your domain

### 2. Add Your Branding

**Logo:**
- Add your logo to `public/logo.png`
- Update Navbar in `src/components/Navbar.tsx`

**Images:**
- Add Open Graph image: `public/og-image.png` (1200x630px)
- Add PWA icons: `public/icon-192.png` and `public/icon-512.png`

### 3. Set Up Contact Form Backend

The contact form is a placeholder. Integrate with:
- **Formspree** (easiest): https://formspree.io/
- **Netlify Forms** (if deploying to Netlify)
- **Custom API** endpoint

Update `src/app/contact/page.tsx` with your chosen solution.

### 4. Connect with Your React App

See `INTEGRATION.md` for detailed options:
- **Option 1**: Deploy separately and link (recommended)
- **Option 2**: Use reverse proxy
- **Option 3**: Iframe embed
- **Option 4**: Migrate to Next.js

### 5. Deploy

**Deploy to Vercel (recommended):**

```bash
npm install -g vercel
cd "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Landing Page\makau-landing"
vercel
```

Follow the prompts and your site will be live in minutes!

**Alternative hosting:**
- Netlify
- Cloudflare Pages
- AWS Amplify
- Your own server

## Project Structure

```
makau-landing/
├── src/
│   ├── app/               # Pages and routing
│   │   ├── page.tsx       # Home page
│   │   ├── contact/       # Contact page
│   │   ├── terms/         # Terms page
│   │   ├── layout.tsx     # Root layout with metadata
│   │   ├── sitemap.ts     # SEO sitemap
│   │   └── robots.ts      # SEO robots.txt
│   └── components/        # Reusable components
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── PricingCard.tsx
│       └── FeatureList.tsx
├── public/                # Static assets
└── package.json
```

## Common Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Customization Tips

**Change colors:**
- Update Tailwind classes in components (e.g., `bg-indigo-600` → `bg-blue-600`)

**Add new pages:**
- Create new folder in `src/app/` (e.g., `src/app/about/page.tsx`)

**Add components:**
- Create new files in `src/components/`

## Need Help?

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Deployment Guide**: See README.md

---

**Ready to launch? Update the content, add your branding, and deploy!** 🚀
