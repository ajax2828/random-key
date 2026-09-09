import { redirect } from 'next/navigation';
import { getUser } from '@/lib/session-actions';

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
