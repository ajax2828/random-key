import { redirect } from 'next/navigation';

export default function HomePage() {
  // Mode tanpa login: langsung ke dashboard (tanpa /login).
  redirect('/dashboard');
}
