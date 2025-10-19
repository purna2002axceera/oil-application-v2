'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    setLoading(true);
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:8080/api/users/login', {
        userName: username,
        password
      });
      console.log(res);
      
      // Check based on backend response
      if (res.data.message === 'Login successful') {
        localStorage.setItem('isLoggedIn', 'true');
        router.push('/');

      } else {
        console.error("Unexpected response:", res.data);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#AC9E9E] px-4">
      <form className='bg-[#474747] p-10 w-[500px] flex flex-col items-center justify-center rounded-md'>
      <h1 className="text-[50px] font-semibold text-[#FC890D] mb-6">Oil Mart</h1>
      <h1 className="text-3xl font-semibold text-[#FC890D] mb-6">Welcome back</h1>
      <div className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          className="bg-[#EEE5E5] p-3 rounded w-full"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="bg-[#EEE5E5] p-3 rounded w-full"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type='submit'
          className="bg-[#FC890D] text-white py-3 rounded hover:opacity-90 transition w-full"
          onClick={handleLogin}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
      <p className='p-5 text-center text-[#C9C9C9] mt-3'>Designed And Developed By C.A Software Solutions</p>
      </form>
    
    </div>
  );
}
