import Link from "next/link";
import { Metadata } from "next";
import FeatureList from "@/components/FeatureList";
import PricingCard from "@/components/PricingCard";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Nyumbani Rentals — Modern Property Management",
  description:
    "Nyumbani Rentals helps landlords and property managers automate bookings, payments and tenant communication.",
  openGraph: {
    title: "Nyumbani Rentals",
    description:
      "Manage properties, automate bookings and get 24/7 tenant support with Nyumbani Rentals.",
    url: "https://example.com",
    siteName: "Nyumbani Rentals",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nyumbani Rentals",
      },
    ],
    type: "website",
  },
};

export default function Home() {
  const features = [
    {
      title: "Payments Integration",
      desc: "We integrate with popular payment methods such as Card payments, Mobile Money and Banks. Payments are automatically recorded and we alert you on the specific tenant who has paid.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    { 
      title: "Invoice/Receipt Management", 
      desc: "Go paperless with email invoices and receipts. You can easily generate invoices and receipts on our platform and send them to tenants.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    { 
      title: "Updated Tenant Records", 
      desc: "Digitized and accurate tenant records and account balances that are easy to sort through and maintain. Helps quickly resolve tenant disputes around account balances.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    { 
      title: "Communication Services", 
      desc: "Easily communicate with tenants using email. We can also call tenants on behalf of landlords to remind them to pay rent. SMS services coming soon!",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      title: "Automate Property Management",
      desc: "Save time by automating repetitive tasks such as reminding tenants to pay, recording payments and sending receipts. Allowing you to easily scale and manage more properties.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      title: "Reports and Statements",
      desc: "Quickly generate tenant, property and landlord statements with the click of a button. Track all payments and account balances effortlessly.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Hero Section with Enhanced Styling */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 blur-3xl opacity-20 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 blur-3xl opacity-20 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full -z-10"></div>
        
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Now available in Kenya
              </div>

              <h1 className="text-5xl font-extrabold leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
                Property Management
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Made Simple</span>
              </h1>
              
              <p className="max-w-xl text-xl text-slate-600 leading-relaxed">
                The all-in-one rental management platform for landlords and property
                managers — bookings, payments, tenant screening and maintenance in
                one place.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all"
                >
                  Get started free
                  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:border-indigo-300 hover:bg-slate-50 transition-all"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Watch demo
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">500+ landlords</div>
                    <div className="text-slate-600">trust Nyumbani</div>
                  </div>
                </div>
                <div className="h-12 w-px bg-slate-300"></div>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">4.9/5 rating</div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-first lg:order-last">
              <div className="relative">
                {/* Floating Card with Shadow */}
                <div className="relative rounded-2xl bg-white p-8 shadow-2xl border border-slate-200">
                  <div className="absolute -top-4 -right-4 h-24 w-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl opacity-20 blur-2xl"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">Quick Start</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Free trial
                    </span>
                  </div>
                  
                  <p className="text-slate-600 mb-6">Choose your plan and start managing properties today.</p>

                  <div className="grid gap-4 sm:grid-cols-2 mb-6">
                    <PricingCard title="Tier 1 (1–10 Units)" price="KSh 2,000/mo" />
                    <PricingCard title="Tier 3 (21–50 Units)" price="KSh 4,500/mo" popular />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      No credit card required
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      30-day free trial
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cancel anytime
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -left-6 h-32 w-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-10 blur-2xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              It's Time to <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Earn More</span> From Your Rentals
            </h2>
            <p className="text-xl text-slate-700 mb-8 leading-relaxed">
              Stop juggling spreadsheets and paperwork. Start growing your rental income today.
            </p>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">80%</span>
                  <span className="text-lg text-slate-600">of our users report a</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">20%+</span>
                  <span className="text-lg text-slate-600">increase in rent collection within</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">3 months</span>
                </div>
              </div>
              
              <p className="text-xl font-semibold text-slate-900 mt-6">
                Don't just take our word for it — try it today.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all"
                >
                  Start Your 30-Day Free Trial
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
                <div className="text-slate-600 font-medium">Happy Landlords</div>
                <p className="text-sm text-slate-500 mt-2">Managing their properties efficiently</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
                <div className="text-slate-600 font-medium">On-Time Payments</div>
                <p className="text-sm text-slate-500 mt-2">Automated reminders improve collection rates</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-4xl font-bold text-purple-600 mb-2">10hrs+</div>
                <div className="text-slate-600 font-medium">Saved Per Month</div>
                <p className="text-sm text-slate-500 mt-2">Less time on admin, more on growth</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to manage rentals</h2>
            <p className="text-xl text-slate-600">Powerful features designed for modern landlords and property managers</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="group relative rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-slate-600">No hidden fees. No surprises. Cancel anytime.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <PricingCard 
              title="Free Trial (30 days)" 
              price="KSh 0" 
              billingNote="Includes all core features"
              features={[
                "Up to 2 properties",
                "Up to 10 units",
                "Email support",
                "Payments & receipts"
              ]} 
            />
            <PricingCard 
              title="Tier 1 (1–10 Units)" 
              price="KSh 2,000/mo" 
              features={[
                "Up to 3 properties", 
                "Up to 10 units",
                "Automated reminders",
                "Tenant emails & receipts"
              ]} 
            />
            <PricingCard 
              title="Tier 2 (11–20 Units)" 
              price="KSh 2,500/mo" 
              features={[
                "Up to 10 properties", 
                "11–20 units",
                "Priority email support",
                "Reports & statements"
              ]} 
            />
            <PricingCard 
              title="Tier 3 (21–50 Units)" 
              price="KSh 4,500/mo" 
              popular
              features={[
                "Up to 10 properties", 
                "21–50 units",
                "Advanced analytics",
                "Custom branding"
              ]} 
            />
            <PricingCard 
              title="Tier 4 (51–100 Units)" 
              price="KSh 7,500/mo" 
              features={[
                "Up to 25 properties", 
                "51–100 units",
                "Priority support",
                "API-ready exports"
              ]} 
            />
            <PricingCard 
              title="Lifetime (One‑Time)" 
              price="KSh 40,000" 
              billingNote="One‑time payment · Lifetime access"
              features={[
                "Unlimited properties", 
                "Up to 50 units only",
                "All features included",
                "No monthly fees ever"
              ]} 
            />
          </div>
          <p className="text-center text-sm text-slate-600 mt-8">Have more than 100 units? <a href="/contact" className="text-indigo-600 hover:text-indigo-700 underline">Contact sales</a> for enterprise pricing.</p>
        </div>
      </section>

  {/* FAQs Section */}
  <FAQ />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to transform your rental business?</h2>
          <p className="text-xl text-indigo-100 mb-4 max-w-2xl mx-auto">
            Join hundreds of landlords who have simplified their property management with Nyumbani Rentals.
          </p>
          <p className="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
            💰 Increase rent collection by 20%+ | ⏰ Save 10+ hours monthly | 📊 Get complete visibility of your portfolio
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all"
          >
            Start your free trial
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-indigo-200">30-day free trial • No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Get in touch</h2>
              <p className="text-xl text-slate-600">Questions? We're here to help. Reach out and we'll respond within 24 hours.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Email us</div>
                    <a className="text-indigo-600 hover:text-indigo-700 transition-colors" href="mailto:nyumbanirentalmanagementsystem@gmail.com">nyumbanirentalmanagementsystem@gmail.com</a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Call us</div>
                    <a className="text-indigo-600 hover:text-indigo-700 transition-colors" href="tel:+254722714334">+254 722 714 334</a>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              By using our services you agree to our <Link href="/terms" className="text-indigo-600 hover:text-indigo-700 underline">terms and conditions</Link> and <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 underline">privacy policy</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
