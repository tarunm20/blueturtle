// frontend/apps/web/app/(marketing)/page.tsx
import Image from 'next/image';
import Link from 'next/link';

import { 
  ArrowRightIcon, 
  MessageCircle, 
  Database, 
  BarChart4, 
  Zap,
  Quote
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';

import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with turtle-inspired gradient and shapes */}
      <div className="relative bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-background pt-16 pb-24 overflow-hidden">
        {/* Turtle shell-inspired decorative elements */}
        <div className="absolute -top-10 right-0 w-64 h-64 rounded-full border-8 border-blue-200/30 dark:border-blue-600/10 -rotate-12"></div>
        <div className="absolute -top-4 right-10 w-48 h-48 rounded-full border-8 border-blue-200/30 dark:border-blue-600/10 -rotate-12"></div>
        
        {/* Subtle wave pattern at bottom suggesting water */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-blue-100/30 dark:bg-blue-900/10 
                       [mask-image:linear-gradient(to_bottom,transparent,black)]">
          <svg viewBox="0 0 1200 100" className="w-full h-full">
            <path 
              d="M0,50 C300,0 600,100 900,50 C1200,0 1500,50 1800,50 L1800,100 L0,100 Z" 
              className="fill-blue-200/40 dark:fill-blue-800/20" />
          </svg>
        </div>
        
        <div className="container mx-auto relative z-10">
          <Hero
            pill={
              <Pill label={'New'}>
                <span>Your data speaks English now</span>
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
                No SQL required.
              </span>
            }
            cta={<MainCallToActionButton />}
            image={
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-blue-200 dark:border-blue-800">
                <Image
                  priority
                  width={1200}
                  height={800}
                  src={`/images/dashboard.webp`}
                  alt={`Chat interface showing natural language queries being converted to SQL and data visualizations`}
                  className="rounded-lg"
                />
              </div>
            }
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-blue-50 dark:bg-blue-950/10 py-24 relative overflow-hidden">
        {/* Turtle shell pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-4 border-blue-500"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full border-4 border-blue-500"></div>
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 rounded-full border-4 border-blue-500"></div>
          <div className="absolute bottom-1/4 right-1/3 w-32 h-32 rounded-full border-4 border-blue-500"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border-4 border-blue-500 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to transform how your team accesses data insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Connect",
                description: "Securely connect to your database in seconds. Works with PostgreSQL, MySQL, SQL Server, and more."
              },
              {
                title: "Ask",
                description: "Simply type your question in plain English. No SQL knowledge required - just ask what you want to know."
              },
              {
                title: "Analyze",
                description: "Get instant results with beautiful visualizations and actionable insights you can share with your team."
              }
            ].map((step, i) => (
              <Card key={i} className="text-center bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow border-blue-100 dark:border-blue-900">
                <CardHeader>
                  <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-4 rounded-full mb-4">
                    {i === 0 ? <Database className="h-10 w-10" /> : 
                     i === 1 ? <MessageCircle className="h-10 w-10" /> : 
                     <BarChart4 className="h-10 w-10" />}
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
      <div className="container mx-auto py-24 relative">
        {/* Subtle turtle silhouette for background */}
        <div className="absolute right-0 bottom-0 opacity-5 w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50,10 C70,10 85,25 85,45 C85,65 70,80 50,80 C30,80 15,65 15,45 C15,25 30,10 50,10 Z" className="fill-blue-500" />
            <path d="M30,45 C30,38 36,32 44,32 C52,32 58,38 58,45 C58,52 52,58 44,58 C36,58 30,52 30,45 Z" className="fill-white" />
            <path d="M44,82 L44,100" className="stroke-blue-500 stroke-2" />
            <path d="M56,82 L56,100" className="stroke-blue-500 stroke-2" />
            <path d="M30,70 L10,90" className="stroke-blue-500 stroke-2" />
            <path d="M70,70 L90,90" className="stroke-blue-500 stroke-2" />
          </svg>
        </div>
        
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
              className={'relative col-span-2 overflow-hidden border-blue-100 dark:border-blue-900'}
              label={'Natural Language Interface'}
              description={`Ask complex questions in plain English and get instant answers. Our AI translates your questions into optimized SQL.`}
            />

            <FeatureCard
              className={'relative col-span-2 w-full overflow-hidden lg:col-span-1 border-blue-100 dark:border-blue-900'}
              label={'Instant Results'}
              description={`No more waiting for the data team. Get answers in seconds, not days.`}
            />

            <FeatureCard
              className={'relative col-span-2 overflow-hidden lg:col-span-1 border-blue-100 dark:border-blue-900'}
              label={'Visual Analytics'}
              description={`Automatic charts and visualizations that make your data easy to understand.`}
            />

            <FeatureCard
              className={'relative col-span-2 overflow-hidden border-blue-100 dark:border-blue-900'}
              label={'Secure Connections'}
              description={`Enterprise-grade security for your database connections. Your data never leaves your infrastructure.`}
            />
          </FeatureGrid>
        </FeatureShowcase>
      </div>

      {/* Use Cases Section */}
      <div className="bg-blue-50 dark:bg-blue-950/10 py-24 relative overflow-hidden">
        {/* Wave pattern suggesting water and turtle habitat */}
        <div className="absolute top-0 left-0 w-full h-12">
          <svg viewBox="0 0 1200 100" className="w-full h-full rotate-180">
            <path 
              d="M0,50 C300,0 600,100 900,50 C1200,0 1500,50 1800,50 L1800,100 L0,100 Z" 
              className="fill-blue-100/50 dark:fill-blue-900/20" />
          </svg>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">For Every Team Member</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everyone deserves access to data insights, not just engineers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                role: "Marketing",
                question: "How did our last campaign perform?",
                benefit: "Track conversion rates and ROI without waiting for reports"
              },
              {
                role: "Sales",
                question: "Who are our highest-value prospects?",
                benefit: "Identify opportunities based on real-time data"
              },
              {
                role: "Product",
                question: "Which features get the most usage?",
                benefit: "Make decisions based on actual user behavior"
              },
              {
                role: "Executive",
                question: "How is revenue trending this quarter?",
                benefit: "Get instant insights for strategic decisions"
              }
            ].map((useCase, i) => (
              <Card key={i} className="overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900">
                <CardHeader className="bg-blue-100 dark:bg-blue-900/50 pb-2">
                  <Badge variant="outline" className="mb-2 w-fit bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                    {useCase.role}
                  </Badge>
                  <CardTitle className="text-lg">
                    "{useCase.question}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground">
                    {useCase.benefit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap section - New section with turtle theme */}
      <div className="container mx-auto py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold mb-4">BlueTurtle Roadmap</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our journey to revolutionize how teams work with data
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Turtle shell pattern as timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-blue-200 dark:bg-blue-800 -translate-x-1/2"></div>
            
            {/* Timeline nodes */}
            {[
              {
                title: "Advanced Data Visualization",
                date: "Q2 2025",
                description: "Customizable visualization templates and more chart types for deeper data exploration"
              },
              {
                title: "Cross-Database Queries",
                date: "Q3 2025",
                description: "Ask questions that span multiple databases with intelligent data joining"
              },
              {
                title: "Predictive Analytics",
                date: "Q4 2025",
                description: "Ask forward-looking questions about your data with AI-powered forecasting"
              }
            ].map((milestone, i) => (
              <div key={i} className={`flex items-start mb-16 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className={`w-1/2 ${i % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                  <Badge className="inline-block mb-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                    {milestone.date}
                  </Badge>
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
                
                <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 z-10"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-background py-16 relative overflow-hidden">
        {/* Turtle swimming illustration at the bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8">
          <svg viewBox="0 0 100 20" className="w-full h-full">
            <path d="M50,0 C60,0 70,5 70,10 C70,15 60,20 50,20 C40,20 30,15 30,10 C30,5 40,0 50,0 Z" className="fill-blue-300/30 dark:fill-blue-700/20" />
            <path d="M35,10 C35,8 40,6 50,6 C60,6 65,8 65,10 C65,12 60,14 50,14 C40,14 35,12 35,10 Z" className="fill-blue-200/30 dark:fill-blue-800/20" />
            <path d="M20,10 L30,10" className="stroke-blue-300/30 dark:stroke-blue-700/20 stroke-2" />
            <path d="M70,10 L80,10" className="stroke-blue-300/30 dark:stroke-blue-700/20 stroke-2" />
          </svg>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl font-heading font-bold mb-4 text-blue-600 dark:text-blue-400">
            Start Asking Your Data Questions Today
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Connect your database in minutes and transform how your team works with data
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="default" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
              <Link href="/auth/sign-up">
                Try Free Demo
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-blue-300 dark:border-blue-700">
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
    <div className={'flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4'}>
      <CtaButton className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>Try Free Demo</span>
            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000 ml-2'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'outline'} className="border-blue-300 dark:border-blue-700">
        <Link href={'/chat'}>
          <span className="flex items-center">
            <MessageCircle className="mr-2 h-4 w-4" />
            See It In Action
          </span>
        </Link>
      </CtaButton>
    </div>
  );
}

export default withI18n(Home);