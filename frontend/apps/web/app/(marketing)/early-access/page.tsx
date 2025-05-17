// frontend/apps/web/app/(marketing)/early-access/page.tsx
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: 'Early Access Sign-up - BlueTurtle',
    description: 'Get early access to BlueTurtle - Ask Your Database Anything'
  };
}

async function EarlyAccessPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title="Early Access Program"
        subtitle="Be among the first to experience BlueTurtle's AI-powered database chat"
      />

      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900 overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Join Our Early Access Program</h2>
            
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in BlueTurtle! By joining our early access program, you'll get:
            </p>
            
            <ul className="list-disc list-inside space-y-2 mb-8 text-muted-foreground">
              <li>First access to our platform when we launch</li>
              <li>Special pricing for early supporters</li>
              <li>Direct line to our product team</li>
              <li>Ability to shape the future of the product</li>
            </ul>
            
            {/* Google Form Embed */}
            <div className="w-full h-[800px] md:h-[600px]">
              <iframe 
                src="https://docs.google.com/forms/d/e/1FAIpQLSfj4WWoFM_JBnPstP-Y0AFsRkPC3P0xS29fVPbhUuD59_AKPg/viewform?embedded=true" 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                marginHeight={0} 
                marginWidth={0}
              >
                Loading…
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withI18n(EarlyAccessPage);