'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from './layouts/MainLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';

export default function HomePage() {

  return (
    <ProtectedRoute>
      <MainLayout>
        <ToastContainer />
      </MainLayout>
    </ProtectedRoute>
  );
}