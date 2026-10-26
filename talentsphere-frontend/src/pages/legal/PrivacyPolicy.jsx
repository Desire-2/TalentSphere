import React from 'react';
import LegalPageLayout, { LegalSection, LegalSubsection } from './LegalPageLayout';

const PrivacyPolicy = () => (
  <LegalPageLayout
    title="Privacy Policy"
    description="How AfriTech Opportunities collects, uses, protects and shares your personal information when you use our jobs, scholarships and internships platform."
  >
    <p className="mb-4">
      AfriTech Opportunities ("we", "us", "our") operates the website
      <strong> jobs.afritechbridge.online</strong> (the "Platform"), a job, scholarship and
      internship portal operated by AfriTech Bridge. This Privacy Policy explains what
      information we collect, how we use it, and the choices you have. By creating an
      account or using the Platform, you agree to this policy.
    </p>

    <LegalSection heading="1. Information we collect">
      <LegalSubsection heading="Information you provide">
        <ul className="list-disc pl-6 space-y-1">
          <li>Account data: name, email address, password (stored only as a secure hash), and account role (job seeker, employer, administrator).</li>
          <li>Profile data: location, phone number, work history, education, skills, CV/résumé uploads, and preferences you choose to add.</li>
          <li>Application data: job or scholarship applications you submit, including messages and uploaded documents.</li>
          <li>Employer data: company profile information, job postings, and advertising campaign details.</li>
          <li>Communications: messages you send through the Platform and responses to support requests.</li>
        </ul>
      </LegalSubsection>
      <LegalSubsection heading="Information collected automatically">
        <ul className="list-disc pl-6 space-y-1">
          <li>Usage data: pages viewed, features used, and referring pages.</li>
          <li>Device and log data: IP address, browser type, operating system, and approximate location derived from IP.</li>
          <li>Cookies and similar technologies (see our <a href="/cookies" className="text-[#1BA398] underline">Cookie Policy</a>).</li>
        </ul>
      </LegalSubsection>
    </LegalSection>

    <LegalSection heading="2. How we use your information">
      <ul className="list-disc pl-6 space-y-1">
        <li>To provide the Platform: account creation, job and scholarship listings, applications, notifications, and employer tools.</li>
        <li>To verify accounts and secure the service, including email verification and fraud prevention.</li>
        <li>To send transactional messages (application status, password resets, verification) and, where you have consented, marketing messages.</li>
        <li>To improve the Platform through aggregated analytics and debugging.</li>
        <li>To display advertising, including Google AdSense, and to measure ad performance.</li>
        <li>To comply with legal obligations and enforce our Terms of Service.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="3. Legal bases for processing (EEA/UK visitors)">
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Contract:</strong> processing needed to provide the service you signed up for.</li>
        <li><strong>Legitimate interests:</strong> securing the service, preventing abuse, and improving the Platform.</li>
        <li><strong>Consent:</strong> marketing messages and non-essential cookies/ads personalization, which you can withdraw at any time.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="4. Advertising and third-party vendors">
      <p className="mb-3">
        We use Google AdSense to display advertisements. Google and its partners may use
        cookies or similar technologies to serve ads based on your prior visits to this or
        other websites. Google's use of advertising cookies enables it and its partners to
        serve ads to you based on your visit to our Platform and/or other sites on the
        Internet.
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#1BA398] underline">Google Ads Settings</a>.</li>
        <li>You may opt out of third-party vendor use of cookies at aboutads.info or the Network Advertising Initiative opt-out page.</li>
        <li>We may also use Google Analytics to understand how visitors use the Platform. You can opt out via the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#1BA398] underline">Google Analytics Opt-out Browser Add-on</a>.</li>
      </ul>
      <p className="mt-3">
        Employers may also purchase on-platform advertising (sponsored placements). Those
        ads are served by us and are labeled as "Sponsored" or "Ad".
      </p>
    </LegalSection>

    <LegalSection heading="5. How we share information">
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>With employers:</strong> your application materials are shared with the employer you apply to.</li>
        <li><strong>With service providers:</strong> hosting, email delivery, analytics, and advertising vendors who process data on our behalf under contract.</li>
        <li><strong>For legal reasons:</strong> when required by law, regulation, or legal process, or to protect the rights, property, or safety of AfriTech Bridge, our users, or the public.</li>
        <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets, subject to standard confidentiality.</li>
      </ul>
      <p className="mt-3">We do not sell your personal information for money.</p>
    </LegalSection>

    <LegalSection heading="6. Data retention">
      <p>
        We keep account and profile data for as long as your account is active. When you
        delete your account, we delete or anonymize your personal data within a reasonable
        period, except where we must retain records to comply with legal obligations,
        resolve disputes, or enforce agreements. Email verification and reset tokens expire
        automatically (within 24 hours).
      </p>
    </LegalSection>

    <LegalSection heading="7. Your rights">
      <p className="mb-3">Depending on your location, you may have the right to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Delete your account and personal data ("right to erasure").</li>
        <li>Export your data in a portable format.</li>
        <li>Object to or restrict certain processing, and withdraw consent.</li>
        <li>Lodge a complaint with a supervisory authority.</li>
      </ul>
      <p className="mt-3">
        You can exercise most of these rights from <strong>Settings</strong> in your
        account, or by contacting us at the address below. We respond within the timeframe
        required by applicable law.
      </p>
    </LegalSection>

    <LegalSection heading="8. Security">
      <p>
        We use industry-standard measures to protect your information, including HTTPS
        transport encryption, hashed passwords, role-based access control on the server,
        and email verification for account recovery. No method of transmission or storage
        is completely secure; please use a strong, unique password and contact us promptly
        if you suspect unauthorized access.
      </p>
    </LegalSection>

    <LegalSection heading="9. Children's privacy">
      <p>
        The Platform is not directed to children under 16 (or the minimum age in your
        jurisdiction), and we do not knowingly collect personal information from them. If
        you believe a child has provided us data, contact us and we will delete it.
      </p>
    </LegalSection>

    <LegalSection heading="10. International transfers">
      <p>
        We are based in Rwanda and process data on servers provided by our hosting
        partners. By using the Platform, you understand that your information may be
        processed in countries other than your own, where data-protection rules may differ.
      </p>
    </LegalSection>

    <LegalSection heading="11. Changes to this policy">
      <p>
        We may update this Privacy Policy from time to time. The "Last updated" date above
        shows when it was last revised. Material changes will be announced through the
        Platform or by email.
      </p>
    </LegalSection>

    <LegalSection heading="12. Contact us">
      <p>
        Questions about this Privacy Policy? Email
        <strong> support@afritechbridge.online</strong> or write to AfriTech Bridge,
        Kigali, Rwanda.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default PrivacyPolicy;
