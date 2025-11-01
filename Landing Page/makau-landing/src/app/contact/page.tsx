"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: in a real app post to an API endpoint
    console.log({ name, email, message });
    setSent(true);
  }

  return (
    <section className="container mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-slate-600">Fill the form or email nyumbanirentalmanagementsystem@gmail.com</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label className="block text-sm">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>

        <div>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-white">Send message</button>
        </div>

        {sent && <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Thanks! We'll be in touch.</div>}
      </form>
    </section>
  );
}
