import MainLayout from '../app/layouts/MainLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HomePage() {
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <ToastContainer />
    </MainLayout>
  );
}
