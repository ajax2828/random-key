import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'RandMail — Random Email & Password Generator',
  description: 'Generate and manage random emails and secure passwords with Supabase database sync.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <div className="bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="app-container">
          <Navbar user={user} />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
