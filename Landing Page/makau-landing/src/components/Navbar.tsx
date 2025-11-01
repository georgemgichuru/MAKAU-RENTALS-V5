import Link from "next/link";
import config from "@/config/app.config";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Nyumbani Rentals
        </Link>

        <nav className="flex items-center gap-6">
          <a href="#features" className="hidden md:inline-block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">Features</a>
          <a href="#pricing" className="hidden md:inline-block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#faqs" className="hidden md:inline-block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">FAQs</a>
          <Link href="/contact" className="hidden sm:inline-block text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">Contact</Link>
          
          <div className="flex items-center gap-3">
            <a 
              href={config.getUrl("login")}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Log In
            </a>
            <a 
              href={config.getUrl("signup")}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all"
            >
              Sign Up
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
