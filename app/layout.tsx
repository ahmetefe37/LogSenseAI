import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'LogSenseAI',
  description: 'A tool for analyzing logs and error outputs using AI via OpenRouter.',
  icons: {
    icon: '/explorer-icon.png',
    shortcut: '/explorer-icon.png',
    apple: '/explorer-icon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>{children}</body>
    </html>
  );
}
