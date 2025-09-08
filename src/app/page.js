'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../app/layouts/MainLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';


export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) { router.push('/login') }
  }, []);

  return (
    <ProtectedRoute>
    <MainLayout>
      <ToastContainer/>
    </MainLayout>
    </ProtectedRoute>
  );
}
