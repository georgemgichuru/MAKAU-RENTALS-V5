# Integration Guide: Connecting Landing Page with React App

This guide shows you how to integrate the Next.js landing page with your existing React rental management application.

## Architecture Overview

You have two separate applications:
1. **Next.js Landing Page** (`makau-landing/`) - Marketing site (this project)
2. **React App** - Main rental management application

## Integration Options

### Option 1: Separate Deployments with Links (Recommended)

Deploy both apps separately and link between them:

**Setup:**
1. Deploy Next.js landing page to `www.makaurentals.com`
2. Deploy React app to `app.makaurentals.com`
3. Add a "Login" or "Go to App" button in the Navbar

**Example Navbar Update:**
```tsx
// src/components/Navbar.tsx
<nav className="flex items-center gap-4 text-sm">
  <a href="#features">Features</a>
  <a href="#pricing">Pricing</a>
  <Link href="/contact">Contact</Link>
  <a href="https://app.makaurentals.com" className="bg-indigo-600 text-white px-4 py-2 rounded-md">
    Go to App
  </a>
</nav>
```

**From React App, link back to landing:**
```jsx
<a href="https://www.makaurentals.com">Back to Home</a>
```

**Pros:**
- Clean separation of concerns
- Easy to maintain
- Best performance

---

### Option 2: Reverse Proxy (Single Domain)

Use a reverse proxy to serve both apps from one domain:

**Example with Nginx:**
```nginx
server {
  listen 80;
  server_name makaurentals.com;

  # Landing page routes
  location / {
    proxy_pass http://localhost:3000;  # Next.js
    proxy_set_header Host $host;
  }

  # React app routes
  location /app {
    proxy_pass http://localhost:5000;  # React app
    proxy_set_header Host $host;
  }

  location /api {
    proxy_pass http://localhost:5000;  # React API
  }
}
```

**Vercel/Netlify Alternative:**
Use their redirect/rewrite rules:

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/app/:path*", "destination": "https://react-app.vercel.app/:path*" }
  ]
}
```

**Pros:**
- Single domain
- SEO benefits

---

### Option 3: Iframe Embed

Embed the landing page into your React app (or vice versa):

```jsx
// In React app
<iframe 
  src="https://landing.makaurentals.com" 
  style={{ width: '100%', height: '100vh', border: 'none' }}
  title="Landing Page"
/>
```

**Pros:**
- Quick integration
- Minimal code changes

**Cons:**
- SEO limitations
- Accessibility challenges

---

### Option 4: Migrate to Next.js (Long-term)

Convert your entire React app to Next.js:

1. Create new pages in `src/app/dashboard`, `src/app/bookings`, etc.
2. Move React components to Next.js components
3. Migrate API routes to Next.js API routes or server actions
4. Update routing from React Router to Next.js App Router

**Pros:**
- Single codebase
- Full Next.js benefits (SSR, SEO, etc.)

**Cons:**
- Requires migration effort

---

## Quick Start: Option 1 Implementation

### Step 1: Add "Login" Button to Landing Page

```tsx
// src/components/Navbar.tsx
export default function Navbar() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000";
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white/60 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          Makau Rentals
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <a href="#features" className="hidden sm:inline-block hover:text-indigo-600">Features</a>
          <a href="#pricing" className="hidden sm:inline-block hover:text-indigo-600">Pricing</a>
          <Link href="/contact" className="hover:text-indigo-600">Contact</Link>
          <a 
            href={APP_URL}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Login
          </a>
        </nav>
      </div>
    </header>
  );
}
```

### Step 2: Add Environment Variable

Create `.env.local`:
```
NEXT_PUBLIC_APP_URL=https://app.makaurentals.com
```

### Step 3: Link from React App to Landing

Add to your React app header:
```jsx
<a href={process.env.REACT_APP_LANDING_URL || "https://www.makaurentals.com"}>
  Home
</a>
```

---

## Deployment Checklist

- [ ] Deploy Next.js landing page (Vercel recommended)
- [ ] Deploy React app
- [ ] Update environment variables with production URLs
- [ ] Test links between both apps
- [ ] Update DNS records
- [ ] Test on mobile devices
- [ ] Verify analytics tracking on both apps

---

## Questions?

See the main README for more details or contact hello@makau.example.
