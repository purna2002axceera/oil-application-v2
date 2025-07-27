'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import CreateBrand from '../components/CreateBrand';
import MainLayout from '../layouts/MainLayout';
import { customToast } from '../utils/toast';


export default function ItemMaster() {
  // State variables
  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  
  const [materialCode, setMaterialCode] = useState('');
  const [wholesaleAmount, setWholesaleAmount] = useState('');
  const [retailAmount, setRetailAmount] = useState('');
  const [productSpecification, setProductSpecification] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [showCreateBrand, setCreateBrand] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Initialize data on component mount
  useEffect(() => {
    fetchBrands();
    fetchItems();
  }, []);

  // API calls
  const fetchBrands = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/brand');
      const data = await response.json();
      setBrands(data);
      console.log("brands data:", data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/item');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // Event handlers
  const handleEdit = (record) => {
    setIsUpdateMode(true);
    setEditingItem(record);
    setSelectedBrand(record.itemBrand.id.toString());
    setMaterialCode(record.itemCode);
    setWholesaleAmount(record.wholesalePrice.toString());
    setRetailAmount(record.retailPrice.toString());
    setMaterialDescription(record.itemDescription);
  };

  const handleAddItem = async () => {
    try {
      if (isUpdateMode) {
        // Update existing item
        await axios.put('http://localhost:8080/api/item', {
          id: editingItem.id,
          itemCode: materialCode,
          itemDescription: materialDescription,
          wholesalePrice: parseFloat(wholesaleAmount) || 0,
          retailPrice: parseFloat(retailAmount) || 0,
          itemBrand: parseInt(selectedBrand),
          status: "ACTIVE",
          modifiedBy: "system_user"
        });
        customToast('success', "Item Updated Successfully");
      } else {
        // Create new item
        await axios.post('http://localhost:8080/api/item', {
          itemCode: materialCode,
          itemDescription: materialDescription,
          wholesalePrice: parseFloat(wholesaleAmount) || 0,
          retailPrice: parseFloat(retailAmount) || 0,
          itemBrand: parseInt(selectedBrand),
          createdBy: "system_user"
        });
        customToast('success', "Item Created Successfully");
      }
      
      handleReset();
      fetchItems();
      
    } catch (error) {
      console.error('Error saving item:', error);
      customToast('error', "Something Went Wrong");
    }
  };

  const handleReset = () => {
    setSelectedBrand('');
    setMaterialCode('');
    setWholesaleAmount('');
    setRetailAmount('');
    setProductSpecification('');
    setMaterialDescription('');
    setIsUpdateMode(false);
    setEditingItem(null);
  };

  const handleAddBrand = () => {
    setCreateBrand(true);
  };

  // Table configuration
  const columns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
    },
    {
      title: 'Description',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
    },
    {
      title: 'Brand',
      dataIndex: ['itemBrand', 'brandName'],
      key: 'brandName',
    },
    {
      title: 'Wholesale Price',
      dataIndex: 'wholesalePrice',
      key: 'wholesalePrice',
      render: (price) => `LKR ${price.toFixed(2)}`,
    },
    {
      title: 'Retail Price',
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      render: (price) => `LKR ${price.toFixed(2)}`,
    },
  
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={() => handleEdit(record)}
          size="small"
        >
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <h1 
        className="text-2xl font-bold mb-6 w-full py-4 px-6 rounded-lg" 
        style={{ 
          background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', 
          color: '#515151' 
        }}
      >
        {isUpdateMode ? 'Update Item' : 'Create Item'}
      </h1>

      {/* Form Section */}
      <div className="space-y-4 flex flex-col w-full">
        {/* Brand and Material Code Row */}
        <div className="flex gap-5">
          <div className="flex items-center w-[40%] space-x-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
            >
              <option value="">Select Brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddBrand}
              className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-gray-800 transition-colors"
            >
              +
            </button>
          </div>
          <input
            type="text"
            placeholder="Material Code"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
        </div>

        {/* Price Inputs Row */}
        <div className="flex gap-5">
          <input
            type="number"
            placeholder="Enter Wholesale Amount"
            value={wholesaleAmount}
            onChange={(e) => setWholesaleAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
          <input
            type="number"
            placeholder="Enter Retail Amount"
            value={retailAmount}
            onChange={(e) => setRetailAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0"
          />
        </div>

        {/* Text Areas Row */}
        <div className="flex gap-5">
          {/* <textarea
            placeholder="Enter Product Specification..."
            value={productSpecification}
            onChange={(e) => setProductSpecification(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 resize-none"
          /> */}
          <textarea
            placeholder="Enter Material Description..."
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleAddItem}
            className="px-6 py-3 w-[200px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors"
          >
            {isUpdateMode ? 'Save Changes' : 'Add Item'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 w-[120px] bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors"
          >
            {isUpdateMode ? 'Cancel' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Items List</h2>
        <Table 
          dataSource={items} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="large"
          className="text-base"
        />
      </div>

      {/* Create Brand Modal */}
      {showCreateBrand && (
        <CreateBrand 
          fetchBrands={fetchBrands} 
          setCreateBrand={setCreateBrand} 
        />
      )}
    </MainLayout>
  );
}