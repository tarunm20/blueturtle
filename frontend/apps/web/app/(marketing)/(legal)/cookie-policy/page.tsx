import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:cookiePolicy'),
  };
}

async function CookiePolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:cookiePolicy`)}
        subtitle={t(`marketing:cookiePolicyDescription`)}
      />

      <div className="container mx-auto py-8">
        <div className="prose prose-blue max-w-none prose-headings:font-heading prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-p:my-4 prose-ul:my-4 prose-li:my-1">
          
          <p className="text-muted-foreground italic">Last updated: May 13, 2025</p>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">1. Introduction</h2>
            <p>
              This Cookie Policy explains how BlueTurtle ("we," "our," or "us") uses cookies and similar technologies on our 
              website and through our BlueTurtle Ask Your Database service (the "Service"). This Cookie Policy should 
              be read together with our Privacy Policy.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">2. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your browser or device by websites, apps, online media, 
              and advertisements. They are used to remember your preferences, maintain your session, and help improve 
              your experience on our Service.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">3. Types of Cookies We Use</h2>
            
            <h3 className="text-lg font-medium mt-4">3.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the Service to function properly. They enable core functionality such as security, 
              network management, and account authentication. You cannot opt out of these cookies as the Service cannot function 
              properly without them.
            </p>
            <p>Examples include:</p>
            <ul className="list-disc ml-6">
              <li>Session cookies that maintain your logged-in state</li>
              <li>Security cookies that help ensure the security of our Service</li>
              <li>Load balancing cookies that distribute traffic to make the Service more efficient</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4">3.2 Functionality Cookies</h3>
            <p>
              These cookies enhance the functionality of our Service by storing your preferences and settings. They may be set 
              by us or by third-party providers whose services we have added to our Service.
            </p>
            <p>Examples include:</p>
            <ul className="list-disc ml-6">
              <li>Language preference cookies</li>
              <li>Theme preference cookies (such as dark mode settings)</li>
              <li>Region or time zone settings</li>
            </ul>
            
            <h3 className="text-lg font-medium mt-4">3.3 Performance/Analytics Cookies</h3>
            <p>
              These cookies collect information about how you use our Service, such as which pages you visit most often, 
              how you navigate through the site, and if you encounter any errors. The information these cookies collect is 
              aggregated and anonymous, and helps us improve how our Service works.
            </p>
            <p>Examples include:</p>
            <ul className="list-disc ml-6">
              <li>Google Analytics cookies</li>
              <li>Performance monitoring cookies</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">4. How to Manage Cookies</h2>
            <p>
              Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies, 
              or to alert you when cookies are being sent. The methods for doing so vary from browser to browser, and 
              from version to version. However, managing cookies through your browser might impact your experience with our Service.
            </p>
            <p>You can generally find the cookie settings in the "options" or "preferences" menu of your browser. To understand 
              these settings, the following links may be helpful:</p>
            <ul className="list-disc ml-6">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary-600 hover:underline">Cookie settings in Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary-600 hover:underline">Cookie settings in Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary-600 hover:underline">Cookie settings in Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" className="text-primary-600 hover:underline">Cookie settings in Edge</a></li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">5. Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, 
              deliver advertisements, and so on. These third-party cookies may include:
            </p>
            <ul className="list-disc ml-6">
              <li>Google Analytics for usage and performance statistics</li>
              <li>Authentication service cookies for secure login</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">6. Do Not Track</h2>
            <p>
              Some browsers have a "Do Not Track" feature that lets you tell websites that you do not want to have your 
              online activities tracked. At this time, we do not respond to browser "Do Not Track" signals.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-primary-700 dark:text-primary-300">7. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other 
              operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed 
              about our use of cookies and related technologies.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(CookiePolicyPage);