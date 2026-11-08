import AuthForm from '@/components/AuthForm';
import { NoticeProvider } from '@/components/NoticeNotification';

export default function LoginPage() {
  return (
    <NoticeProvider>
      <AuthForm type="login" />
    </NoticeProvider>
  );
}
