// frontend/apps/web/app/(marketing)/page.tsx
import Image from 'next/image';
import Link from 'next/link';

import { 
  ArrowRight, 
  MessageCircle, 
  Database, 
  BarChart4, 
  Zap,
  CheckCircle
} from 'lucide-react';

import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';

import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with simplified animations */}
      <div className="relative bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-background pt-16 pb-24 overflow-hidden">
        {/* Decorative elements with native Tailwind animations */}
        <div className="absolute -top-10 right-0 w-64 h-64 rounded-full border-8 border-blue-200/30 dark:border-blue-600/10 animate-pulse"></div>
        <div className="absolute top-40 left-10 w-20 h-20 rounded-full bg-blue-100/20 dark:bg-blue-800/10 animate-pulse"></div>
        
        {/* Additional animated elements */}
        <div className="absolute bottom-60 right-20 w-16 h-16 rounded-full bg-blue-200/20 dark:bg-blue-700/10 animate-ping"></div>
        <div className="absolute top-80 left-1/4 w-10 h-10 rounded-full bg-blue-300/20 dark:bg-blue-600/10 animate-bounce"></div>
        
        {/* Subtle wave pattern at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden">
          <svg viewBox="0 0 1200 120" className="absolute w-full h-full">
            <path 
              d="M0,60 C300,30 600,90 900,60 C1200,30 1500,60 1800,60 L1800,120 L0,120 Z" 
              className="fill-blue-100/30 dark:fill-blue-800/20" />
          </svg>
        </div>
        
        <div className="container mx-auto relative z-10">
          <Hero
            pill={
              <Pill label={'NEW'}>
                <span>Chat with your data in plain English</span>
              </Pill>
            }
            title={
              <>
                <span className="text-blue-600 dark:text-blue-400">BlueTurtle</span>
                <span className="block">Ask Your Database</span>
                <span className="text-blue-600 dark:text-blue-400">Anything</span>
              </>
            }
            subtitle={
              <span>
                From questions to insights in seconds. Connect your database, 
                chat in plain English, and get instant answers with visual results.
              </span>
            }
            cta={<MainCallToActionButton />}
            image={
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-blue-200 dark:border-blue-800 transition-all hover:shadow-xl">
                {/* Add a subtle hover effect to the image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 z-10"></div>
                
                {/* Add animated cursor dot that blinks occasionally */}
                <div className="absolute top-[45%] left-[20%] w-3 h-3 bg-blue-500 rounded-full z-20 animate-ping"></div>
                
                <Image
                  priority
                  width={1200}
                  height={800}
                  src={`/images/dashboard.webp`}
                  alt={`Chat interface showing natural language queries being converted to SQL and data visualizations`}
                  className="rounded-lg transform transition duration-700 hover:scale-105"
                />
              </div>
            }
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-blue-50 dark:bg-blue-950/10 py-20 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to transform how your team accesses data insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Database className="h-10 w-10" />,
                title: "Connect",
                description: "Securely connect to your database in seconds. Works with PostgreSQL, MySQL, SQL Server, and more."
              },
              {
                icon: <MessageCircle className="h-10 w-10" />,
                title: "Ask",
                description: "Simply type your question in plain English. No SQL knowledge required - just ask what you want to know."
              },
              {
                icon: <BarChart4 className="h-10 w-10" />,
                title: "Analyze",
                description: "Get instant results with beautiful visualizations and actionable insights you can share with your team."
              }
            ].map((step, i) => (
              <Card key={i} className="text-center bg-white dark:bg-gray-900 border-blue-100 dark:border-blue-900 hover:shadow-md transition-shadow hover:translate-y-[-4px] transition-transform duration-300">
                <CardHeader>
                  <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-4 rounded-full mb-4">
                    {step.icon}
                  </div>
                  <CardTitle className="text-xl">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-20 relative">
        <FeatureShowcase
          heading={
            <>
              <b className="font-semibold text-blue-600 dark:text-blue-400">
                Data insights for everyone
              </b>
              .{' '}
              <span className="text-muted-foreground font-normal">
                No more bottlenecks between questions and answers.
              </span>
            </>
          }
          icon={
            <FeatureShowcaseIconContainer className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Zap className="h-5" />
              <span>Powerful features</span>
            </FeatureShowcaseIconContainer>
          }
        >
          <FeatureGrid>
            <FeatureCard
              className='col-span-2 overflow-hidden border-blue-100 dark:border-blue-900 hover:shadow-md transition-all hover:translate-y-[-4px] duration-300'
              label='Natural Language Interface'
              description='Ask complex questions in plain English and get instant answers. Our AI translates your questions into optimized SQL.'
            />

            <FeatureCard
              className='col-span-2 w-full overflow-hidden lg:col-span-1 border-blue-100 dark:border-blue-900 hover:shadow-md transition-all hover:translate-y-[-4px] duration-300'
              label='Instant Results'
              description='No more waiting for the data team. Get answers in seconds, not days.'
            />

            <FeatureCard
              className='col-span-2 overflow-hidden lg:col-span-1 border-blue-100 dark:border-blue-900 hover:shadow-md transition-all hover:translate-y-[-4px] duration-300'
              label='Visual Analytics'
              description='Automatic charts and visualizations that make your data easy to understand.'
            />

            <FeatureCard
              className='col-span-2 overflow-hidden border-blue-100 dark:border-blue-900 hover:shadow-md transition-all hover:translate-y-[-4px] duration-300'
              label='Secure Connections'
              description='Enterprise-grade security for your database connections. Your data never leaves your infrastructure.'
            />
          </FeatureGrid>
        </FeatureShowcase>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-background py-20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">Why Choose BlueTurtle?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transform how your team works with data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "No SQL Knowledge Required",
                description: "Ask questions in plain English and get insights immediately"
              },
              {
                title: "10x Faster Insights",
                description: "Get answers in seconds instead of waiting days for reports"
              },
              {
                title: "Beautiful Visualizations",
                description: "Automatically generate the right charts for your data"
              },
              {
                title: "Enterprise Security",
                description: "Your data stays within your infrastructure at all times"
              },
              {
                title: "Seamless Integration",
                description: "Works with all major databases without any configuration"
              },
              {
                title: "Empower Every Team",
                description: "From marketing to finance, everyone can access data insights"
              }
            ].map((benefit, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900 p-6 rounded-lg hover:shadow-md transition-all hover:translate-y-[-4px] duration-300">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-blue-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10 dark:to-transparent z-0"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl font-heading font-bold mb-4 text-blue-600 dark:text-blue-400">
            Start Asking Your Data Questions Today
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Connect your database in minutes and transform how your team works with data
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="default" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 gap-2 transition-transform hover:translate-y-[-4px] duration-300">
              <Link href="/auth/sign-up">
                Try Free Demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-blue-300 dark:border-blue-700 transition-transform hover:translate-y-[-4px] duration-300">
              <Link href="/contact">
                Schedule Demo
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Free for 14 days.
          </p>
        </div>
      </div>
    </div>
  );
}

function MainCallToActionButton() {
  return (
    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <CtaButton className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-transform hover:translate-y-[-4px] duration-300">
        <Link href="/auth/sign-up">
          <span className="flex items-center space-x-0.5">
            <span>Try Free Demo</span>
            <ArrowRight className="h-4 w-4 ml-2 animate-pulse" />
          </span>
        </Link>
      </CtaButton>
    </div>
  );
}

export default withI18n(Home);