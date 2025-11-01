# Makau Rentals Landing Page - Setup Guide

## 🎨 Enhanced Features

Your landing page has been upgraded with:

### ✨ Design Improvements
- **Modern gradient backgrounds** with decorative elements
- **Enhanced hero section** with animated badges and trust indicators
- **Improved typography** with larger, bolder headings
- **Better visual hierarchy** with proper spacing and sections
- **Smooth animations** and hover effects
- **Professional pricing cards** with popular badge and enhanced styling
- **Comprehensive footer** with social links and better organization
- **Custom scrollbar** and smooth scroll behavior

### 🔐 Authentication Integration
- **Login button** in the navbar linking to your React app
- **Sign Up button** with prominent gradient styling
- Both buttons redirect to your React website's authentication pages

## 🔧 Configuration

### Step 1: Update React App URL

Edit the file: `src/config/app.config.ts`

```typescript
export const config: AppConfig = {
  // Change this to your React app URL
  reactAppUrl: "http://localhost:3001", // or your production URL
  
  routes: {
    login: "/login",    // Update if your login route is different
    signup: "/signup",  // Update if your signup route is different
  },
};
```

### Step 2: (Optional) Use Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your React app URL:
   ```
   NEXT_PUBLIC_REACT_APP_URL=https://your-react-app.com
   ```

The environment variable will take precedence over the hardcoded value in `app.config.ts`.

## 🚀 Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Customization Guide

### Colors
The color scheme uses Tailwind's indigo and purple gradients. To change:
- Search for `indigo-` and `purple-` in the codebase
- Replace with your preferred colors (e.g., `blue-`, `green-`, etc.)

### Content
- **Hero section**: Edit `src/app/page.tsx` - Look for the `<h1>` and description text
- **Features**: Update the `features` array in `page.tsx`
- **Pricing**: Modify the `PricingCard` components in `page.tsx`
- **Contact info**: Update email and phone in both `page.tsx` and `Footer.tsx`

### Logo
- The SVG house icon can be replaced in both `Navbar.tsx` and `Footer.tsx`
- Or add an image: Replace the SVG with `<Image src="/logo.png" alt="Logo" />`

## 📱 Responsive Design

The landing page is fully responsive:
- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Test on different screen sizes

## 🎯 Key Sections

1. **Hero Section** - Main value proposition with CTA buttons
2. **Features Section** - 4 key features with icons
3. **Pricing Section** - 3 pricing tiers (Starter, Business, Enterprise)
4. **CTA Section** - Secondary call-to-action with gradient background
5. **Contact Section** - Email and phone information
6. **Footer** - Links, social media, and company info

## 🔗 Navigation Links

The Login and Sign Up buttons will redirect to:
- Login: `{YOUR_REACT_APP_URL}/login`
- Sign Up: `{YOUR_REACT_APP_URL}/signup`

Make sure these routes exist in your React application!

## 📦 Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # Root layout with Navbar and Footer
│   ├── globals.css        # Global styles
│   ├── contact/
│   └── terms/
├── components/
│   ├── Navbar.tsx         # Navigation with Login/Sign Up buttons
│   ├── Footer.tsx         # Enhanced footer
│   ├── PricingCard.tsx    # Pricing card component
│   └── FeatureList.tsx    # Feature list component
└── config/
    └── app.config.ts      # App configuration
```

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Geist Font** - Modern typography

## 📄 License & Terms

Update the terms page at `src/app/terms/page.tsx` with your actual terms and conditions.

---

Need help? Check the [Next.js documentation](https://nextjs.org/docs) or [Tailwind CSS docs](https://tailwindcss.com/docs).
