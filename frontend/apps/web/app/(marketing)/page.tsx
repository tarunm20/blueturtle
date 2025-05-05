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
    <div className={'flex flex-col'}>
      {/* Hero Section */}
      <div className={'container mx-auto pt-16 pb-24'}>
        <Hero
          pill={
            <Pill label={'New'}>
              <span>Your data speaks English now</span>
            </Pill>
          }
          title={
            <>
              <span>Ask Your Database</span>
              <span className="text-primary">Anything</span>
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
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-muted">
              <Image
                priority
                width={1200}
                height={800}
                src={`/images/dashboard.webp`}
                alt={`Chat interface showing natural language queries being converted to SQL and data visualizations`}
                className="rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 p-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium text-primary">User:</span>
                  <span className="ml-2">Show me our top 5 customers by order value last month</span>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* How It Works Section */}
      <div className="bg-muted/30 py-24">
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
                title: "Connect",
                description: "Securely connect to your database in minutes. Works with PostgreSQL, MySQL, SQL Server, and more."
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
              <Card key={i} className="text-center bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                    {i === 0 ? <Database className="h-10 w-10 text-primary" /> : 
                     i === 1 ? <MessageCircle className="h-10 w-10 text-primary" /> : 
                     <BarChart4 className="h-10 w-10 text-primary" />}
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
      <div className="container mx-auto py-24">
        <FeatureShowcase
          heading={
            <>
              <b className="font-semibold dark:text-white">
                Data insights for everyone
              </b>
              .{' '}
              <span className="text-muted-foreground font-normal">
                No more bottlenecks between questions and answers.
              </span>
            </>
          }
          icon={
            <FeatureShowcaseIconContainer>
              <Zap className="h-5" />
              <span>Powerful features</span>
            </FeatureShowcaseIconContainer>
          }
        >
          <FeatureGrid>
            <FeatureCard
              className={'relative col-span-2 overflow-hidden'}
              label={'Natural Language Interface'}
              description={`Ask complex questions in plain English and get instant answers. Our AI translates your questions into optimized SQL.`}
            />

            <FeatureCard
              className={'relative col-span-2 w-full overflow-hidden lg:col-span-1'}
              label={'Instant Results'}
              description={`No more waiting for the data team. Get answers in seconds, not days.`}
            />

            <FeatureCard
              className={'relative col-span-2 overflow-hidden lg:col-span-1'}
              label={'Visual Analytics'}
              description={`Automatic charts and visualizations that make your data easy to understand.`}
            />

            <FeatureCard
              className={'relative col-span-2 overflow-hidden'}
              label={'Secure Connections'}
              description={`Enterprise-grade security for your database connections. Your data never leaves your infrastructure.`}
            />
          </FeatureGrid>
        </FeatureShowcase>
      </div>

      {/* Use Cases Section */}
      <div className="bg-primary/5 py-24">
        <div className="container mx-auto">
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
              <Card key={i} className="overflow-hidden border-2 bg-card">
                <CardHeader className="bg-primary/10 pb-2">
                  <Badge variant="outline" className="mb-2 w-fit">
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

      {/* CTA Section */}
      <div className="bg-primary/10 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Start Asking Your Data Questions Today
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Connect your database in minutes and transform how your team works with data
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="default">
              <Link href="/auth/sign-up">
                Try Free Demo
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
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

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4'}>
      <CtaButton>
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

      <CtaButton variant={'outline'}>
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