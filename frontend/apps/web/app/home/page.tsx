import { PageBody, PageHeader } from '@kit/ui/page';
import ChatPage from './chat';

export default function HomePage() {
  return (
    <>
      <PageHeader description={'Your SaaS at a glance'} />
        <ChatPage />
      <PageBody>
      </PageBody>
    </>
  );
}
