import './globals.css';

// IMPORTANT: replace this with your real deployed domain (e.g. the .vercel.app
// URL or your custom domain) once you know it. WhatsApp/Facebook need an
// absolute URL to fetch the preview image — a relative path won't work for
// link previews shared outside your own site.
const ROOT_URL = 'https://chathurajayawardhane.com';
const SITE_URL = `${ROOT_URL}/wedding`;

export const metadata = {
  metadataBase: new URL(ROOT_URL),
  title: 'Chathura & Lakmini — Wedding Invitation',
  description: 'You are lovingly invited to the wedding of Chathura & Lakmini.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Chathura & Lakmini — Wedding Invitation',
    description: 'You are lovingly invited to the wedding of Chathura & Lakmini.',
    url: SITE_URL,
    siteName: 'Chathura & Lakmini — Wedding Invitation',
    images: [
      {
        url: '/images/couple-illustration.png',
        width: 1200,
        height: 630,
        alt: 'Chathura & Lakmini',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chathura & Lakmini — Wedding Invitation',
    description: 'You are lovingly invited to the wedding of Chathura & Lakmini.',
    images: ['/images/couple-illustration.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Playfair+Display:ital@1&family=Parisienne&family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
