import React from 'react';
import LegalPageLayout, { LegalSection } from './LegalPageLayout';

const CookiePolicy = () => (
  <LegalPageLayout
    title="Cookie Policy"
    description="The cookies and similar technologies used by AfriTech Opportunities for authentication, preferences, analytics and Google AdSense advertising."
  >
    <p className="mb-4">
      This Cookie Policy explains how <strong>jobs.afritechbridge.online</strong> uses
      cookies and similar technologies. It should be read together with our
      <a href="/privacy" className="text-[#1BA398] underline"> Privacy Policy</a>.
    </p>

    <LegalSection heading="What are cookies">
      <p>
        Cookies are small text files placed on your device by a website. They let the
        website remember your actions and preferences over a period of time. Similar
        technologies (such as local storage) work in comparable ways.
      </p>
    </LegalSection>

    <LegalSection heading="Cookies we set">
      <table className="w-full text-sm border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-2 border-b">Purpose</th>
            <th className="p-2 border-b">Type</th>
            <th className="p-2 border-b">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Keeping you signed in and securing sessions (authentication token)</td>
            <td className="p-2 border-b">Necessary</td>
            <td className="p-2 border-b">Session / until logout</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Remembering interface preferences (e.g. sidebar state)</td>
            <td className="p-2 border-b">Functional</td>
            <td className="p-2 border-b">Up to 1 year</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Cookie-consent choice storage</td>
            <td className="p-2 border-b">Functional</td>
            <td className="p-2 border-b">Up to 1 year</td>
          </tr>
        </tbody>
      </table>
    </LegalSection>

    <LegalSection heading="Cookies set by third parties">
      <p className="mb-2">With your consent, third parties may set cookies when you visit the Platform:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Google AdSense</strong> — advertising cookies used to display ads and to
          measure ad performance and, where personalized ads are enabled, to tailor ads to
          your interests. Learn how Google uses cookies at
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#1BA398] underline"> Google's Advertising Technologies page</a>.
          Manage ad personalization at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#1BA398] underline">Google Ads Settings</a>.
        </li>
        <li>
          <strong>Google Analytics</strong> — analytics cookies that help us understand how
          visitors use the Platform (pages viewed, traffic sources) in aggregate. Opt out
          with the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#1BA398] underline">Google Analytics Opt-out Add-on</a>.
        </li>
      </ul>
    </LegalSection>

    <LegalSection heading="Your choices">
      <ul className="list-disc pl-6 space-y-1">
        <li>When you first visit, our cookie banner lets you accept or decline non-essential cookies. You can change your choice at any time by clearing the site's stored consent or contacting us.</li>
        <li>Most browsers let you block or delete cookies in settings. Blocking necessary cookies may sign you out or break core features.</li>
        <li>You can opt out of personalized ads from Google and other networks via industry opt-out tools such as aboutads.info.</li>
      </ul>
    </LegalSection>

    <LegalSection heading="Updates">
      <p>
        We may update this Cookie Policy as our use of technologies changes. The "Last
        updated" date above shows the latest revision.
      </p>
    </LegalSection>

    <LegalSection heading="Contact">
      <p>
        Questions about this policy? Email <strong>support@afritechbridge.online</strong>.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default CookiePolicy;
