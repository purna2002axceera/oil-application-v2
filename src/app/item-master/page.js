'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import CreateBrand from '../components/CreateBrand';
import MainLayout from '../layouts/MainLayout';
import { customToast } from '../utils/toast';
import { L_Number_List } from '../utils/l_numbers';
import { Select } from 'antd';


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
      console.log("items data:", data);
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

  const handleDelete = async ( data ) => {
     try {
       const res = await axios.delete(`http://localhost:8080/api/item/${data.id}`);
       if( !res.data.id ){
          customToast('error', "Error When Deleting");
          return
       }
        customToast('success', "Item Deleted Successfully");     
        handleReset();
        fetchItems();
     } catch (error) {
      if(error.response.data.message.includes("This item has associated GRN")){
        return  customToast('error', `This item has associated GRN`);
      }
        customToast('error', `Error When Deleting ${error}`);
     } 
  }

 const handleAddItem = async () => {
  try {
    if (!wholesaleAmount || !materialCode || !selectedBrand || !retailAmount) {
      return customToast('error', "All Fields Are Required");
    }
    let LnumberData = L_Number_List.find((data) => materialCode === data.code);
    if (!isUpdateMode || (editingItem && editingItem.itemCode !== materialCode)) {
      if (!LnumberData) {
        return customToast('error', "Invalid L Number");
      }
    }
    if (isUpdateMode) {
      
      await axios.put('http://localhost:8080/api/item', {
        id: editingItem.id,
        itemCode: materialCode,
        itemDescription: materialDescription,
        wholesalePrice: parseFloat(wholesaleAmount) || 0,
        retailPrice: parseFloat(retailAmount) || 0,
        itemBrand: parseInt(selectedBrand),
        status: "ACTIVE",
        modifiedBy: "system_user",
        packSize: LnumberData.pack_size,
        packUnit: LnumberData.pack_unit,
      });

      customToast('success', "Item Updated Successfully");
    } else {
      await axios.post('http://localhost:8080/api/item', {
        itemCode: materialCode,
        itemDescription: materialDescription,
        wholesalePrice: parseFloat(wholesaleAmount) || 0,
        retailPrice: parseFloat(retailAmount) || 0,
        itemBrand: parseInt(selectedBrand),
        packSize: LnumberData.pack_size,
        packUnit: LnumberData.pack_unit,
        createdBy: "system_user"
      });
      customToast('success', "Item Created Successfully");
    }

    handleReset();
    fetchItems();

  } catch (error) {
    console.error('Error saving item:', error);
    if( error.response.data.message.includes("Item already exists with this code and brand") ){
      customToast('error', "Item already exists with this code and brand");
    }else{
      customToast('error', "Something Went Wrong");
    }
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

 const handleDeleteBrand = async (id) => {
  try {
    const response = await axios.delete(`http://localhost:8080/api/brand/${id}`);

    if (response.data && response.data.id) {
      customToast('success', 'Brand Deleted Successfully');
      fetchBrands(); 
      if (selectedBrand === id.toString()) {
        setSelectedBrand('');
      }
    } else {
      customToast('error', 'Error when deleting brand');
    }
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'Error deleting brand';
    customToast('error', message);
  }
};



  const columns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
    },
    {
      title: 'Brand',
      dataIndex: ['itemBrand', 'brandName'],
      key: 'brandName',
    },
    {
      title: 'Retail Price',
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      render: (price) => `LKR ${price.toFixed(2)}`,
    },
    {
      title: 'Wholesale Price',
      dataIndex: 'wholesalePrice',
      key: 'wholesalePrice',
      render: (price) => `LKR ${price.toFixed(2)}`,
    },
    {
      title: 'Available Stock',
      dataIndex: 'availableStock',
      key: 'availableStock',
    },
    {
      title: 'Description',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
    },
    {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <>
       <Button 
         type="primary" 
         icon={<EditOutlined />} 
         onClick={() => handleEdit(record)}
         size="small"
         style={{ marginRight: 8 }}
       />
      <Button 
        type="primary" 
        danger
        icon={<DeleteOutlined />} 
        onClick={() => handleDelete(record)}
        size="small"
      />
    </>
  ),
}
]

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

        <div className="flex gap-5 w-full">
          <div className='flex flex-col w-full'>
            <label className='mb-1'>Select Brand</label>
            <div className="flex items-center gap-2 space-x-2">
            <Select
              value={selectedBrand || undefined}
              onChange={(value) => setSelectedBrand(value)}
              placeholder="Select Brand"
              className='!shadow-md border-0'
              style={{ flex: 1, height: 48, borderRadius: 9, background: '#fff', boxShadow: '0 2px 8px #f0f1f2', fontFamily:'Poppins' }}
              dropdownStyle={{ borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px #f0f1f2', padding: 8 }}
            >
              {brands.length === 0 && (
                <Select.Option disabled key="no-brands">No Brands</Select.Option>
              )}
              {brands.map((brand) => (
                <Select.Option value={brand.id.toString()} key={brand.id} className="custom-ant-option">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily:'Poppins' }}>
                    <span>{brand.brandName}</span>
                    <DeleteOutlined
                      onClick={e => { e.stopPropagation(); handleDeleteBrand(brand.id) }}
                      style={{ color: 'red', marginLeft: 8 }}
                    />
                  </div>
                </Select.Option>
              ))}
            </Select>

            <button onClick={handleAddBrand} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-gray-800 transition-colors" >
              +
            </button>
          </div>
          </div>
     
          <div className='flex flex-col w-full'>
           <label className='mb-1'>Material Code</label>
           <input
            type="text"
            placeholder="Material Code"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
          />
          </div>
          
        </div>

        {/* Price Inputs Row */}
       <div className="flex gap-5">
       <div className="flex flex-col w-full">
       <label className="mb-1">Wholesale Amount</label>
       <input
         type="number"
         placeholder="Enter Wholesale Amount"
         value={wholesaleAmount}
         onChange={(e) => setWholesaleAmount(e.target.value)}
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
       />
       </div>

       <div className="flex flex-col w-full">
       <label className="mb-1">Retail Amount</label>
       <input
        type="number"
        placeholder="Enter Retail Amount"
        value={retailAmount}
        onChange={(e) => setRetailAmount(e.target.value)}
        className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
       />
       </div>
       </div>

        {/* Text Areas Row */}
        <div className="flex flex-col">
          <label className="mb-1">Description</label>
          <textarea
            placeholder="Enter Material Description..."
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 resize-none bg-white"
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