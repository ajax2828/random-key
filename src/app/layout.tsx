import type { Metadata } from 'next';
import './globals.css';
import { getUser } from '@/lib/session-actions';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'RandMail — Random Email & Password Generator',
  description: 'Generate and manage random emails and secure passwords — no login, no database.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

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
