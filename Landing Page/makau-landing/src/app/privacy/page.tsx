export default function PrivacyPage() {
  return (
    <section className="container mx-auto px-6 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-slate-600">Last Updated: November 1, 2025</p>

      <div className="mt-8 space-y-8 text-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
          <p className="leading-relaxed">
            Welcome to Nyumbani Rental Management System ("we," "our," "us"). This Privacy Policy explains how WFREELANCERS collects, uses, discloses, and safeguards your information when you use our rental management platform, website, and mobile application (collectively, the "Service").
          </p>
          <p className="mt-3 leading-relaxed">
            By using the Nyumbani Rental Management System, you consent to the data practices described in this policy. If you do not agree with the terms of this Privacy Policy, please do not access or use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-4">2.1. Personal Information</h3>
          <p className="leading-relaxed">We may collect personal information that you voluntarily provide to us when you:</p>
          <ul className="mt-2 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Register for an account (name, email address, phone number)</li>
            <li>Use the Service as a Landlord or Tenant</li>
            <li>Make or receive payments through our platform</li>
            <li>Contact us for customer support</li>
            <li>Subscribe to our newsletters or marketing communications</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">2.2. Property and Tenancy Information</h3>
          <p className="leading-relaxed">If you are a Landlord, we collect:</p>
          <ul className="mt-2 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Property details (address, type, rental amount)</li>
            <li>Tenancy agreements and lease terms</li>
            <li>Tenant information you provide</li>
            <li>Payment and transaction records</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">2.3. Payment Information</h3>
          <p className="leading-relaxed">
            When you make payments through our Service, we work with third-party payment processors (PesaPal). We collect transaction information including payment method details, transaction amounts, and payment confirmations. Please note that sensitive payment card information is handled directly by our payment processor and is not stored on our servers.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">2.4. Automatically Collected Information</h3>
          <p className="leading-relaxed">When you use our Service, we automatically collect:</p>
          <ul className="mt-2 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, features used)</li>
            <li>Log data (access times, error logs)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
          <p className="leading-relaxed">We use the information we collect to:</p>
          <ul className="mt-3 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Provide, operate, and maintain the Service</li>
            <li>Process rental payments and transactions</li>
            <li>Send invoices, receipts, and payment confirmations</li>
            <li>Communicate with you via email, phone calls, or other methods about your account, payments, and service updates</li>
            <li>Send reminders to tenants about upcoming or overdue rent payments (via email or phone calls on behalf of landlords)</li>
            <li>Generate reports and statements for landlords and tenants</li>
            <li>Improve and optimize our Service</li>
            <li>Provide customer support and respond to your inquiries</li>
            <li>Detect, prevent, and address technical issues and fraud</li>
            <li>Comply with legal obligations</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. How We Share Your Information</h2>
          <p className="leading-relaxed">We may share your information in the following circumstances:</p>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-4">4.1. With Other Users</h3>
          <p className="leading-relaxed">
            Landlords and their associated tenants can view each other's relevant information necessary for the tenancy relationship (e.g., payment history, account balances, property details).
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">4.2. With Service Providers</h3>
          <p className="leading-relaxed">We share information with third-party service providers who perform services on our behalf, including:</p>
          <ul className="mt-2 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li><strong>PesaPal:</strong> For payment processing</li>
            <li><strong>Email service providers:</strong> For sending invoices, receipts, and communications</li>
            <li><strong>Telecommunications providers:</strong> For making phone calls to tenants on behalf of landlords</li>
            <li><strong>SMS service providers:</strong> (Coming soon) For sending text messages</li>
            <li><strong>Cloud hosting providers:</strong> For data storage and infrastructure</li>
            <li><strong>Analytics providers:</strong> For understanding Service usage</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">4.3. For Legal Reasons</h3>
          <p className="leading-relaxed">We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, government agencies).</p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">4.4. Business Transfers</h3>
          <p className="leading-relaxed">
            If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Security</h2>
          <p className="leading-relaxed">
            We implement commercially reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. These measures include:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure servers and databases</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Employee training on data protection</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Data Retention</h2>
          <p className="leading-relaxed">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
          </p>
          <p className="mt-3 leading-relaxed">
            Payment records and transaction data may be retained for longer periods to comply with legal, accounting, and regulatory requirements.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Your Rights and Choices</h2>
          <p className="leading-relaxed">Depending on your location, you may have the following rights:</p>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-4">7.1. Access and Correction</h3>
          <p className="leading-relaxed">
            You can access and update your personal information through your account settings or by contacting us.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">7.2. Data Portability</h3>
          <p className="leading-relaxed">
            You may request a copy of your personal information in a structured, commonly used format.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">7.3. Deletion</h3>
          <p className="leading-relaxed">
            You may request deletion of your personal information, subject to legal retention requirements.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">7.4. Marketing Communications</h3>
          <p className="leading-relaxed">
            You can opt out of receiving marketing communications by following the unsubscribe instructions in our emails or contacting us directly.
          </p>

          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">7.5. Cookies</h3>
          <p className="leading-relaxed">
            You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of the Service.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Children's Privacy</h2>
          <p className="leading-relaxed">
            Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">9. International Data Transfers</h2>
          <p className="leading-relaxed">
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We take steps to ensure that your information receives an adequate level of protection in the jurisdictions in which we process it.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Third-Party Links</h2>
          <p className="leading-relaxed">
            Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies before providing any information to them.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Changes to This Privacy Policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We may also notify you via email or through the Service.
          </p>
          <p className="mt-3 leading-relaxed">
            Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Kenya Data Protection Act Compliance</h2>
          <p className="leading-relaxed">
            We are committed to complying with the Kenya Data Protection Act, 2019. As a data controller and processor, we ensure that personal data is:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Processed lawfully, fairly, and in a transparent manner</li>
            <li>Collected for specified, explicit, and legitimate purposes</li>
            <li>Adequate, relevant, and limited to what is necessary</li>
            <li>Accurate and kept up to date</li>
            <li>Kept in a form that permits identification for no longer than necessary</li>
            <li>Processed in a manner that ensures appropriate security</li>
          </ul>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Contact Us</h2>
          <p className="leading-relaxed mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:nyumbanirentalmanagementsystem@gmail.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                nyumbanirentalmanagementsystem@gmail.com
              </a>
            </p>
            <p className="flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+254722714334" className="text-indigo-600 hover:text-indigo-700 font-medium">
                +254 722 714 334
              </a>
            </p>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            <strong>WFREELANCERS</strong><br />
            Nyumbani Rental Management System<br />
            Kenya
          </p>
        </div>
      </div>
    </section>
  );
}
