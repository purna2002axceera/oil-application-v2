'use client';
import React, { useState } from 'react';
import { customToast } from '../utils/toast';


const CreateBrand = ({fetchBrands, setCreateBrand}) => {
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState('');

  const handleCreateBrand = async () => {
    // Clear previous error
    setError('');
    
    // Validate brand name
    if (!brandName.trim()) {
      setError('Brand name cannot be empty');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName: brandName.trim(),
          createdBy: "system_user"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Brand created:', data);
      fetchBrands();
      setCreateBrand(false);
      customToast('success', "Brand Added Successfully");

    } catch (error) {
      console.error('Error creating brand:', error);
      setError('Failed to create brand. Please try again.');
    }
  };

  const handleCancel = () => {
    setCreateBrand(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold mb-6">Add New Brand</h1>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Brand Name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
          
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleCreateBrand}
              className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors"
            >
              Create Brand
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

export default CreateBrand;