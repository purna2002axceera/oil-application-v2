import { Poppins } from 'next/font/google';
import '../app/globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'], 
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Oil Management System',
  description: 'Manage your oil business',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
