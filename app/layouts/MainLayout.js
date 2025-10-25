'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const logout=() =>{ localStorage.clear() } 

  const navLinks = [
    { name: 'Item Master', path: '/item-master' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Purchase Order', path: '/purchase-order' },
    { name: 'Sales Order', path: '/sales' },
    { name: 'Return Note', path: '/return' },
    { name: 'Credit Customer', path: '/credit-customer' },
    { name: 'Expenses', path: '/expenses' },
    { name: 'Logout', path: '/login' }
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

        <div className="space-y-4 text-white">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.path;
            return (
             <a
  key={`${link.path}-${index}`}
  onClick={() => {
    if (link.name === 'Logout') {
      logout();
      router.push('/login'); // make sure to navigate after clearing
    }
  }}
  href={link.name === 'Logout' ? undefined : link.path} // prevent default navigation for logout
  className={`block px-4 py-2 rounded transition font-medium
    ${isActive 
      ? 'bg-[#2c2c2c] font-bold border-0' 
      : 'border border-[#969696] hover:bg-[#4c4c4c]'
    }`}
>
  {link.name}
</a>

            );
          })}
        </div>
      </aside>

      <main className="flex-1 p-6 bg-[#1F1C1C] overflow-auto">{ children }</main>
      <ToastContainer />
    </div>
  );
}