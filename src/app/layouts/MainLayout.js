'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../globals.css'

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Item Master', path: '/item-master' },
    { name: 'Good Receive Notice', path: '/grn' },
    { name: 'Logout', path: '/logout' }
  ];

  return (
    <div className="flex h-screen">
      <aside
        className="w-[300px] p-4 flex flex-col"
        style={{ background: 'linear-gradient(135deg, #6E6666 0%, #3b4251 100%)' }}
      >
        <div className="bg-[#3d3c3c] text-white text-2xl font-bold text-center py-4 rounded mb-6">
          Oil Mart
        </div>

        <div className="space-y-2 text-white">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.path;
            return (
              <a
                key={`${link.path}-${index}`}
                href={link.path}
                className={`block px-4 py-2 rounded transition font-medium ${
                  isActive ? 'bg-[#2c2c2c] font-bold' : 'hover:bg-[#4c4c4c]' }`}
              >
                {link.name}
              </a>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 p-6 bg-gray-100 overflow-auto">{ children }</main>

      <ToastContainer />
    </div>
  );
}
