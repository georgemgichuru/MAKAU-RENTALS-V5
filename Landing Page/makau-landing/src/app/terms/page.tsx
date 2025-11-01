export default function TermsPage() {
  return (
    <section className="container mx-auto px-6 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold text-slate-900">Terms and Conditions</h1>
      <p className="mt-2 text-slate-600">Last Updated: 10/12/2025</p>

      <div className="mt-8 space-y-8 text-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction and Acceptance of Terms</h2>
          <p className="leading-relaxed">
            Welcome to the Nyumbani Rental Management System ("the System," "the Service," "the App"), a software service provided by WFREELANCERS ("Company," "we," "us," "our"). These Terms and Conditions ("Terms") govern your access to and use of our website, mobile application, and all related services.
          </p>
          <p className="mt-4 leading-relaxed">
            By registering for, accessing, or using the Nyumbani Rental Management System, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you are entering into these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these Terms. If you do not agree with all of these Terms, you are prohibited from using the Service.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Definitions</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>"Landlord"</strong> refers to an individual or entity that owns a property and uses the System to manage tenancies and collect rent.</li>
            <li><strong>"Tenant"</strong> refers to an individual who rents a property and uses the System to make rental payments.</li>
            <li><strong>"User"</strong> refers to any individual or entity (Landlord or Tenant) who registers for and uses the System.</li>
            <li><strong>"PesaPal"</strong> refers to the third-party payment gateway service provided by PesaPal Limited that facilitates payments through various methods, including but not limited to M-Pesa, Airtel Money, credit/debit cards, and bank transfers.</li>
            <li><strong>"Payment Gateway"</strong> refers to the technology provided by PesaPal that processes and facilitates payment transactions initiated within the System.</li>
            <li><strong>"Payment Confirmation"</strong> refers to the electronic data and callback we receive from PesaPal confirming a successful transaction.</li>
            <li><strong>"Content"</strong> refers to all data, text, images, property details, and payment information uploaded or transmitted through the System.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Account Registration and Security</h2>
          <p className="leading-relaxed"><strong>3.1.</strong> To use the System, you must register for an account by providing accurate, current, and complete information.</p>
          <p className="mt-3 leading-relaxed"><strong>3.2.</strong> You are responsible for safeguarding your account password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
          <p className="mt-3 leading-relaxed"><strong>3.3.</strong> You must be at least 18 years of age to use the Service.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Description of Service</h2>
          <p className="leading-relaxed">The Nyumbani Rental Management System provides a platform that enables:</p>
          <ul className="mt-3 list-disc list-inside space-y-2 leading-relaxed">
            <li>Landlords to list properties, manage tenancy agreements, and track rental payments.</li>
            <li>Tenants to view their rental obligations and make payments via the integrated PesaPal payment gateway.</li>
            <li>Automated tracking and recording of payment transactions based on PesaPal payment confirmations.</li>
            <li>Generation of reports for Landlords and Tenants regarding payment history.</li>
            <li>Communication features related to the tenancy and payments.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Financial Transactions and PesaPal Payment Gateway</h2>
          <p className="leading-relaxed"><strong>5.1. Payment Processing:</strong> The System facilitates rent payments through the PesaPal payment gateway. We are not a bank, financial institution, or money transmitter. We act as a technical intermediary to initiate the payment request via PesaPal on your behalf.</p>
          <p className="mt-3 leading-relaxed"><strong>5.2. PesaPal Terms:</strong> Your use of PesaPal is governed by PesaPal's terms and conditions and privacy policy. We are not responsible for the actions or inactions of PesaPal, its partners, or any underlying payment provider (such as Safaricom for M-Pesa transactions), including network failures, transaction delays, or errors.</p>
          <p className="mt-3 leading-relaxed"><strong>5.3. Payment Confirmation:</strong> A payment is only considered received and recorded once we have received a successful Payment Confirmation from PesaPal. The timestamp and details from this confirmation are definitive for the purpose of tracking payments within the System.</p>
          <p className="mt-3 leading-relaxed"><strong>5.4. Transaction Errors:</strong> In the event of a disputed or failed transaction, you must first contact PesaPal's customer support. While we will provide reasonable assistance by sharing the Payment Confirmation data we received, we cannot reverse or refund transactions processed by PesaPal. All disputes regarding the transfer of funds must be resolved directly with PesaPal, who may liaise with the relevant payment provider as necessary.</p>
          <p className="mt-3 leading-relaxed"><strong>5.5. Fees:</strong> WFREELANCERS may charge a service fee for the use of the System. Any such fees will be clearly disclosed to you within the App before you confirm a transaction. You authorize us to deduct these fees from the payment amount or charge them separately as specified. Note that PesaPal may also charge transaction fees as per their own pricing policy, which will be disclosed to you by PesaPal during the payment process.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. User Responsibilities and Conduct</h2>
          <p className="leading-relaxed"><strong>6.1. Lawful Use:</strong> You agree to use the Service only for lawful purposes and in accordance with these Terms. You are solely responsible for all Content you submit.</p>
          <p className="mt-3 leading-relaxed"><strong>6.2. Prohibited Activities:</strong> You shall not:</p>
          <ul className="mt-2 list-disc list-inside space-y-2 leading-relaxed ml-4">
            <li>Use the System to commit fraud or engage in illegal activities.</li>
            <li>Upload any Content that is false, misleading, or infringes on any third party's rights.</li>
            <li>Interfere with or disrupt the integrity or performance of the System.</li>
            <li>Attempt to gain unauthorized access to the System or its related systems.</li>
            <li>Use the System to harass, abuse, or harm another person.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Data Privacy and Use of Information</h2>
          <p className="leading-relaxed"><strong>7.1.</strong> We collect and process personal data, including payment information, in accordance with our Privacy Policy, which is incorporated into these Terms by reference.</p>
          <p className="mt-3 leading-relaxed"><strong>7.2.</strong> By using the System, you consent to us receiving and processing transaction data from PesaPal to provide the Service, including generating reports and sending payment confirmations.</p>
          <p className="mt-3 leading-relaxed"><strong>7.3.</strong> We implement commercially reasonable security measures to protect your data. However, we cannot guarantee absolute security.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Intellectual Property</h2>
          <p className="leading-relaxed">
            The Nyumbani Rental Management System, including its source code, design, logos, and all content created by us, is the exclusive property of WFREELANCERS and is protected by copyright and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the System for its intended purposes.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Disclaimer of Warranties</h2>
          <p className="leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WFREELANCERS DISCLAIMS ALL WARRANTIES, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Limitation of Liability</h2>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <p className="leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WFREELANCERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-none space-y-2 leading-relaxed ml-4">
              <li>(A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE;</li>
              <li>(B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE (E.G., DISPUTES BETWEEN LANDLORDS AND TENANTS);</li>
              <li>(C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT;</li>
              <li>(D) ANY ISSUES RELATED TO THE PESAPAL PAYMENT GATEWAY OR ANY UNDERLYING PAYMENT METHOD.</li>
            </ul>
            <p className="leading-relaxed mt-3">
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT OF FEES YOU HAVE PAID TO US IN THE SIX (6) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Indemnification</h2>
          <p className="leading-relaxed">
            You agree to indemnify and hold harmless WFREELANCERS, its officers, directors, employees, and agents from and against any claims, disputes, demands, liabilities, damages, losses, and costs and expenses (including reasonable legal fees) arising out of or in any way connected with (a) your access to or use of the Service, (b) your Content, or (c) your violation of these Terms.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Termination</h2>
          <p className="leading-relaxed"><strong>12.1.</strong> We may suspend or terminate your account and access to the Service at our sole discretion if you violate these Terms.</p>
          <p className="mt-3 leading-relaxed"><strong>12.2.</strong> You may terminate your account at any time by contacting us.</p>
          <p className="mt-3 leading-relaxed"><strong>12.3.</strong> Upon termination, your right to use the Service will cease immediately. Provisions of these Terms that, by their nature, should survive termination will do so.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Governing Law and Dispute Resolution</h2>
          <p className="leading-relaxed"><strong>13.1.</strong> These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya.</p>
          <p className="mt-3 leading-relaxed"><strong>13.2.</strong> Any dispute arising out of or in connection with these Terms shall first be subject to a mediation process. If mediation is unsuccessful, the dispute shall be referred to the exclusive jurisdiction of the courts of Kenya.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Changes to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right to modify or replace these Terms at any time at our sole discretion. We will provide notice of changes by updating the "Last Updated" date and/or by notifying you through the App. Your continued use of the Service after any changes constitutes your acceptance of the new Terms.
          </p>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">15. Contact Information</h2>
          <p className="leading-relaxed mb-4">If you have any questions about these Terms, please contact us at:</p>
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
        </div>
      </div>
    </section>
  );
}
