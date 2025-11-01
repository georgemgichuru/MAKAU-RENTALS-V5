type Props = {
  title: string;
  price: string;
  features?: string[];
  popular?: boolean;
  billingNote?: string; // override the default "Billed monthly" text
};

export default function PricingCard({ title, price, features, popular, billingNote }: Props) {
  return (
    <div className={`relative rounded-2xl border p-6 bg-white transition-all duration-300 hover:shadow-xl ${
      popular 
        ? "border-indigo-300 shadow-lg ring-2 ring-indigo-100" 
        : "border-slate-200 hover:border-indigo-200"
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-slate-900">{title}</h4>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold text-slate-900">{price}</div>
        <div className="mt-2 text-sm text-slate-600">{billingNote ?? "Billed monthly. Cancel anytime."}</div>
      </div>

      {features && (
        <ul className="mb-6 space-y-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
              <svg className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      <button className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
        popular
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700"
          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
      }`}>
        {price === "Contact us" ? "Contact sales" : "Choose plan"}
      </button>
    </div>
  );
}
