export const metadata = {
  title: 'Telegram Mini App',
  description: 'Mini App for Telegram bot',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}