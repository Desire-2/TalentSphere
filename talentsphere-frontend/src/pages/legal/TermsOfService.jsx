import React from 'react';
import LegalPageLayout, { LegalSection } from './LegalPageLayout';

const TermsOfService = () => (
  <LegalPageLayout
    title="Terms of Service"
    description="The terms and conditions that govern your use of the AfriTech Opportunities jobs, scholarships and internships platform."
  >
    <p className="mb-4">
      These Terms of Service ("Terms") govern your use of <strong>jobs.afritechbridge.online</strong>
      (the "Platform"), operated by AfriTech Bridge ("we", "us"). By creating an account or
      using the Platform, you agree to these Terms. If you do not agree, do not use the
      Platform.
    </p>

    <LegalSection heading="1. The service">
      <p>
        AfriTech Opportunities is a job, scholarship and internship portal. We connect job
        seekers with employers and scholarship providers. We are not an employer and do not
        guarantee employment, scholarships, interviews, or any specific outcome from using
        the Platform.
      </p>
    </LegalSection>

    <LegalSection heading="2. Accounts">
      <ul className="list-disc pl-6 space-y-1">
        <li>You must provide accurate, current information and keep it up to date.</li>
        <li>You must be at least 16 years old (or the minimum working age in your location) to use the Platform.</li>
        <li>You are responsible for safeguarding your password and for all activity under your account.</li>
        <li>One person or entity may not maintain multiple accounts to misrepresent identity or circumvent limits.</li>
        <li>We may suspend or close accounts that provide false information, impersonate others, or violate these Terms.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="3. Job seekers">
      <ul className="list-disc pl-6 space-y-1">
        <li>Application materials you submit are shared with the employer or scholarship provider you apply to.</li>
        <li>You are responsible for the accuracy of your profile, CV and applications.</li>
        <li>We do not verify every employer or listing; independently research opportunities and never pay money to apply for a job or scholarship.</li>
        <li>Report suspicious listings or employers through the Platform or by contacting support.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="4. Employers">
      <ul className="list-disc pl-6 space-y-1">
        <li>Job listings must be genuine, lawful, non-discriminatory, and accurate. Spam, multi-level marketing schemes, pay-to-apply listings, and listings that collect fees from applicants are prohibited.</li>
        <li>You must have the right to post the content and brands you upload.</li>
        <li>You must handle applicant data in line with applicable data-protection law and only for recruitment purposes.</li>
        <li>Advertising campaigns on the Platform must comply with our advertising rules and applicable law.</li>
        <li>We may moderate, reject, or remove listings and campaigns that violate these Terms.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="5. Acceptable use">
      <p className="mb-2">You may not use the Platform to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Post unlawful, fraudulent, harassing, hateful, or sexually exploitative content.</li>
        <li>Distribute malware, phish for credentials, or attempt to breach or probe our security.</li>
        <li>Scrape, harvest, or bulk-export data except through features we provide for that purpose.</li>
        <li>Impersonate any person or misrepresent your affiliation with any organization.</li>
        <li>Interfere with the Platform, including overloading, automating abuse, or circumventing access controls.</li>
        <li>Use contact information of users for unsolicited marketing outside the Platform's application flow.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="6. Content">
      <p>
        You retain ownership of content you submit. By submitting content, you grant us a
        worldwide, non-exclusive, royalty-free license to host, display, reproduce, and
        distribute that content on the Platform (for example, showing your job posting to
        visitors or your application to an employer). You are responsible for the content
        you submit and its compliance with the law.
      </p>
    </LegalSection>

    <LegalSection heading="7. Paid services">
      <p>
        Some features (for example Career Agent subscriptions or advertising credits) may
        be offered for a fee. Prices, duration and limits are shown before purchase.
        Payments are processed by our payment partners; we do not store full card details.
        Unless required by law, fees already paid for a started subscription period are
        non-refundable. We may change prices prospectively with notice.
      </p>
    </LegalSection>

    <LegalSection heading="8. Disclaimers">
      <p>
        The Platform is provided "as is" and "as available" without warranties of any kind,
        express or implied, including warranties of merchantability, fitness for a
        particular purpose, and non-infringement. We do not warrant that listings are
        accurate or that the Platform will be uninterrupted, secure, or error-free.
      </p>
    </LegalSection>

    <LegalSection heading="9. Limitation of liability">
      <p>
        To the maximum extent permitted by law, AfriTech Bridge and its team will not be
        liable for indirect, incidental, special, consequential, or punitive damages, or for
        loss of profits, data, or goodwill, arising from your use of the Platform. Our total
        liability for any claim relating to the Platform will not exceed the amount you
        paid us in the 12 months before the claim (or 100 USD if you have paid nothing).
      </p>
    </LegalSection>

    <LegalSection heading="10. Termination">
      <p>
        You may stop using the Platform at any time and delete your account from Settings.
        We may suspend or terminate access if you violate these Terms, create risk for
        other users, or if required by law. Sections that by their nature should survive
        termination (including content licenses, disclaimers, and liability limits) will
        survive.
      </p>
    </LegalSection>

    <LegalSection heading="11. Governing law">
      <p>
        These Terms are governed by the laws of the Republic of Rwanda, without regard to
        conflict-of-law rules. Courts of Kigali, Rwanda have exclusive jurisdiction over
        disputes arising from these Terms, except where consumer-protection law in your
        location provides otherwise.
      </p>
    </LegalSection>

    <LegalSection heading="12. Changes and contact">
      <p>
        We may update these Terms; the "Last updated" date reflects the latest version.
        Continued use after changes means you accept them. Questions? Email
        <strong> support@afritechbridge.online</strong>.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default TermsOfService;
