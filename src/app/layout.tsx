import type { Metadata } from 'next';
import './globals.css';
import { Outfit, Nunito } from 'next/font/google';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
});

const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Music Mood Insight — Your Feelings Have a Sound',
  description:
    'An AI-powered emotional music recommendation app that analyzes your mood through facial expressions and journal text, then recommends the perfect music to match your feelings.',
  keywords: ['mood', 'music', 'emotion', 'AI', 'spotify', 'facial recognition', 'sentiment analysis'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${outfit.variable} ${nunito.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
