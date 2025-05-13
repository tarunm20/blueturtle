import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:termsOfService'),
  };
}

async function TermsOfServicePage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:termsOfService`)}
        subtitle={t(`marketing:termsOfServiceDescription`)}
      />

      <div className="container mx-auto py-8">
        <div className="prose prose-blue max-w-none prose-headings:font-heading prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          
          <p className="text-muted-foreground italic">Last updated: May 12, 2025</p>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">1. Acceptance of Terms</h2>
            <p>By accessing or using BlueTurtle.ai ("Service"), you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">2. Description of Service</h2>
            <p>BlueTurtle.ai provides an AI-powered business intelligence platform that generates SQL queries and visual analytics in response to user queries.</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">3. Eligibility & Account</h2>
            <ul className="list-disc ml-6">
              <li>You must be 18 or older and have the power to form legally binding contracts.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">4. User Conduct</h2>
            <ul className="list-disc ml-6">
              <li>Use the Service only for lawful purposes.</li>
              <li>Do not attempt to reverse-engineer, overload, or otherwise interfere with the Service.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">5. Fees & Payment</h2>
            <ul className="list-disc ml-6">
              <li>Access to certain features may require payment of fees as described in your subscription plan.</li>
              <li>All fees are non‑refundable except as required by law.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">6. Intellectual Property</h2>
            <ul className="list-disc ml-6">
              <li>BlueTurtle.ai and its content (excluding your data) are our property and protected by applicable laws.</li>
              <li>You retain ownership of your data; by using the Service, you grant us a license to process and display it.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">7. Privacy & Data Security</h2>
            <ul className="list-disc ml-6">
              <li>We handle your data according to our Privacy Policy.</li>
              <li>We implement reasonable security measures but cannot guarantee absolute protection.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">8. Disclaimers</h2>
            <ul className="list-disc ml-6">
              <li>The Service is provided "as is" without warranties of any kind.</li>
              <li>We do not guarantee accuracy of AI-generated queries or analytics.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">9. Limitation of Liability</h2>
            <ul className="list-disc ml-6">
              <li>To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the Service.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">10. Termination</h2>
            <ul className="list-disc ml-6">
              <li>We may suspend or terminate your access for violations of these Terms.</li>
              <li>Upon termination, your right to use the Service ends and we may delete your data.</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">11. Governing Law</h2>
            <p>These Terms are governed by the laws of California, without regard to conflict of laws principles.</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">12. Changes to Terms</h2>
            <p>We may update these Terms at any time. We will post the revised Terms with a new "Last updated" date. Continued use constitutes acceptance.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(TermsOfServicePage);