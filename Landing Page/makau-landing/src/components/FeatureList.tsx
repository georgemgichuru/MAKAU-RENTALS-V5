type Feature = {
  title: string;
  desc?: string;
};

export default function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {features.map((f, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            {/* simple check icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-medium">{f.title}</div>
            {f.desc && <div className="mt-1 text-sm text-slate-600">{f.desc}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
