import './globals.css';

export const metadata = {
  title: 'Chathura & Lakmini — Wedding Invitation',
  description: 'You are lovingly invited to the wedding of Chathura & Lakmini.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="si">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Poppins:wght@300;400;500&family=Noto+Serif+Sinhala:wght@500;700&family=Noto+Sans+Sinhala:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}