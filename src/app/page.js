'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../app/layouts/MainLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) { router.push('/login') }
  }, []);

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <ToastContainer />
    </MainLayout>
  );
}
