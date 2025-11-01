# Makau Rentals — Landing Page

A Next.js landing page for **Makau Rentals** — a modern property and rental management platform. This landing page showcases features, pricing, contact information, and terms & conditions.

## Features

✅ **SEO-optimized**: Metadata, Open Graph, Twitter cards, sitemap, robots.txt  
✅ **Responsive design**: Built with Tailwind CSS  
✅ **Pages**: Home, Contact, Terms & Conditions  
✅ **Reusable components**: Navbar, Footer, PricingCard, FeatureList  
✅ **TypeScript** and **ESLint** configured  

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### 3. Build for production

```bash
npm run build
npm start
```

The production build will be created in `.next/`.

## Project Structure

```
makau-landing/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with Navbar/Footer
│   │   ├── page.tsx         # Home page (hero, features, pricing)
│   │   ├── contact/         # Contact page with form
│   │   ├── terms/           # Terms & Conditions
│   │   ├── sitemap.ts       # Sitemap generation
│   │   └── robots.ts        # Robots.txt generation
│   └── components/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── PricingCard.tsx
│       └── FeatureList.tsx
├── public/
│   └── manifest.json        # PWA manifest
└── ...config files
```

## SEO & Metadata

- **Metadata** is configured in `src/app/layout.tsx` (title, description, keywords, Open Graph, Twitter cards).
- **Sitemap** is generated at `/sitemap.xml` via `src/app/sitemap.ts`.
- **Robots.txt** is generated at `/robots.txt` via `src/app/robots.ts`.
- **Manifest** for PWA is at `public/manifest.json`.
- Update the `metadataBase` URL in `src/app/layout.tsx` to your production domain.

## Integrating with Your React App

You can integrate this Next.js landing page with your existing React app in several ways:

### Option 1: Link from your React app to the Next.js landing page

Deploy the Next.js landing page on a subdomain (e.g., `www.makaurentals.com`) and your React app on the main domain or another subdomain (e.g., `app.makaurentals.com`). Link between them using regular `<a>` tags.

### Option 2: Embed using an iframe

Embed the Next.js landing page into your React app using an iframe:

```jsx
<iframe src="https://landing.makaurentals.com" style={{ width: '100%', height: '100vh', border: 'none' }} />
```

### Option 3: Reverse proxy

Use a reverse proxy (Nginx, Cloudflare, etc.) to serve the Next.js app on `/` and your React app on `/app`.

Example Nginx config:

```nginx
location / {
  proxy_pass http://localhost:3000;  # Next.js landing
}
location /app {
  proxy_pass http://localhost:5000;  # React app
}
```

### Option 4: Migrate to Next.js

Convert your React app to Next.js pages and combine both projects under one Next.js app.

## Customization

- **Colors**: Update Tailwind config and CSS variables in `globals.css`.
- **Contact form backend**: Replace the placeholder in `src/app/contact/page.tsx` with your API endpoint (e.g., Formspree, Netlify Forms, or custom backend).
- **Images**: Add your logo and Open Graph image to `public/` and update references in metadata.
- **Pricing**: Update pricing data in `src/app/page.tsx`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new):

```bash
npm install -g vercel
vercel
```

Vercel will automatically detect Next.js and configure build settings.

---

**Makau Rentals** — Built with Next.js, TypeScript & Tailwind CSS.
