import './globals.css';

export const metadata = {
  title: 'La Mia Libreria di Fumetti',
  description: 'Una libreria digitale per i tuoi fumetti',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
