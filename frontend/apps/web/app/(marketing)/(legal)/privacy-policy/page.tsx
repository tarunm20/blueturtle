import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:privacyPolicy'),
  };
}

async function PrivacyPolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t('marketing:privacyPolicy')}
        subtitle={t('marketing:privacyPolicyDescription')}
      />

      <div className="container mx-auto py-8">
        <div className="prose prose-blue max-w-none prose-headings:font-heading prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          
          <p className="text-muted-foreground italic">Last updated: May 13, 2025</p>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">1. Introduction</h2>
            <p>
              Welcome to BlueTurtle ("we," "our," or "us"). We respect your privacy and are committed to protecting 
              your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our BlueTurtle Ask Your Database service (the "Service").
            </p>
            <p>
              Please read this Privacy Policy carefully. By using our Service, you acknowledge that you have read 
              and understood this Privacy Policy.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mt-4">2.1 Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul className="list-disc ml-6">
              <li><strong>Account Information</strong>: When you register for an account, we collect your name, email address, and password.</li>
              <li><strong>Profile Information</strong>: Information you provide in your user profile, such as profile pictures.</li>
              <li><strong>Database Connection Information</strong>: Database credentials you provide to connect to your databases, including hostnames, port numbers, database names, usernames, and passwords.</li>
              <li><strong>Chat History</strong>: The questions you ask and the responses provided by our system.</li>
              <li><strong>Usage Data</strong>: Information about how you use our Service, including SQL queries generated.</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4">2.2 Technical Information</h3>
            <p>We automatically collect certain information when you visit, use, or navigate our Service:</p>
            <ul className="list-disc ml-6">
              <li><strong>Device Information</strong>: Information about your device, such as IP address, browser type, operating system, and device identifiers.</li>
              <li><strong>Usage Information</strong>: Information about your interactions with our Service, such as pages visited, features used, and time spent on the Service.</li>
              <li><strong>Cookies and Similar Technologies</strong>: Information collected through cookies and similar tracking technologies (see our Cookie Policy for more details).</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul className="list-disc ml-6">
              <li>To provide and maintain our Service</li>
              <li>To fulfill the purpose for which you provided the information</li>
              <li>To generate SQL queries based on your natural language questions</li>
              <li>To process and complete transactions</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To send administrative information, such as updates, security alerts, and support messages</li>
              <li>To personalize your experience with our Service</li>
              <li>To improve our Service and develop new features and functionality</li>
              <li>To protect our Service and prevent fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information from 
              unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over 
              the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
            
            <h3 className="text-lg font-medium mt-4">4.1 Database Credentials Security</h3>
            <p>We take special precautions to secure the database credentials you provide:</p>
            <ul className="list-disc ml-6">
              <li>Database credentials are encrypted during transmission using TLS/SSL</li>
              <li>We do not store your database credentials unless you explicitly opt-in to saving them</li>
              <li>If you choose to save your credentials, they are stored in an encrypted format</li>
              <li>Your database connection is established directly between our backend services and your database, and all queries are executed within this secure connection</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">5. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul className="list-disc ml-6">
              <li><strong>With Service Providers</strong>: We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
              <li><strong>For Business Transfers</strong>: We may share your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
              <li><strong>With Your Consent</strong>: We may share your information with your consent or at your direction.</li>
              <li><strong>Legal Requirements</strong>: We may disclose your information as required by law or in response to valid requests by public authorities.</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">6. Data Retention</h2>
            <p>
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this 
              Privacy Policy, unless a longer retention period is required or permitted by law. We will retain and use your 
              information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">7. Your Rights and Choices</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul className="list-disc ml-6">
              <li><strong>Access</strong>: You may request access to your personal information.</li>
              <li><strong>Correction</strong>: You may request that we correct inaccurate or incomplete information.</li>
              <li><strong>Deletion</strong>: You may request that we delete your personal information.</li>
              <li><strong>Restriction</strong>: You may request that we restrict the processing of your personal information.</li>
              <li><strong>Data Portability</strong>: You may request a copy of your personal information in a structured, machine-readable format.</li>
              <li><strong>Objection</strong>: You may object to our processing of your personal information.</li>
            </ul>
            <p>To exercise any of these rights, please contact us at privacy@blueturtle.ai.</p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">8. Children's Privacy</h2>
            <p>
              Our Service is not directed to children under the age of 18, and we do not knowingly collect personal 
              information from children under the age of 18. If we learn that we have collected personal information from 
              a child under the age of 18, we will promptly delete that information.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to, and maintained on, computers located outside of your state, 
              province, country, or other governmental jurisdiction where the data protection laws may differ from 
              those in your jurisdiction. If you are located outside the United States and choose to provide information 
              to us, please note that we transfer the information to the United States and process it there.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">10. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites and services. We are not responsible for the content 
              or privacy practices of those websites or services. We encourage you to review the privacy policies of 
              any third-party websites or services that you visit.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">11. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy 
              Policy periodically for any changes.
            </p>
          </section>
        
        </div>
      </div>
    </div>
  );
}

export default withI18n(PrivacyPolicyPage);