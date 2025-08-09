'use client';
import React, { useState } from 'react';
import { customToast } from '../utils/toast';

const CreateCustomer = ({fetchCustomers, setCreateCustomer}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNic, setCustomerNic] = useState('');
  const [error, setError] = useState('');

  const generateCustomerNumber = () => {
    const timestamp = Date.now();
    return `CUST${timestamp.toString().slice(-6)}`;
  };

  const handleCreateCustomer = async () => {
    // Clear previous error
    setError('');
    
    // Validate required fields
    if (!customerName.trim()) {
      setError('Customer name cannot be empty');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Customer phone cannot be empty');
      return;
    }

    try {
      const customerData = {
        customerNo: generateCustomerNumber(),
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim() || '',
        customerPhone: customerPhone.trim(),
        customerNic: customerNic.trim() || '',
        createdAt: new Date().toISOString()
      };

      const response = await fetch('http://localhost:8080/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Customer created:', data);
      fetchCustomers();
      setCreateCustomer(false);
      customToast('success', "Customer Added Successfully");

    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to create customer. Please try again.');
    }
  };

  const handleCancel = () => {
    setCreateCustomer(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold mb-6">Add New Customer</h1>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Customer Name *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
          
          <input
            type="text"
            placeholder="Enter Customer Address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
          
          <input
            type="text"
            placeholder="Enter Customer Phone *"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
          
          <input
            type="text"
            placeholder="Enter Customer NIC"
            value={customerNic}
            onChange={(e) => setCustomerNic(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
          
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleCreateCustomer}
              className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors"
            >
              Create Customer
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomer;