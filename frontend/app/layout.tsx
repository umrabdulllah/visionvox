'use client';

import { Inter } from 'next/font/google';
import { MainNav } from '@/components/main-nav';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminView = pathname === '/admin';

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {!isAdminView && <MainNav />}
          <main>{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
