'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Popconfirm, InputNumber, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import CreateBrand from '../components/CreateBrand';
import MainLayout from '../layouts/MainLayout';
import { customToast } from '../utils/toast';
import { L_Number_List } from '../utils/l_numbers';

export default function ItemMaster() {
  // State variables

  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [lNumber, setLNumber] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [wholesaleAmount, setWholesaleAmount] = useState('');
  const [retailAmount, setRetailAmount] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [showCreateBrand, setCreateBrand] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchBrand, setSearchBrand] = useState('');
  const [searchPNumber, setSearchPNumber] = useState('');
  const [searchLNumber, setSearchLNumber] = useState('');
  const [searchMaterialCode, setSearchMaterialCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Compute Material Code for search bar
  useEffect(() => {
    let brandObj = brands.find(b => b.id.toString() === searchBrand);
    if (brandObj && searchPNumber && searchLNumber) {
      setSearchMaterialCode(`${brandObj.brandName} ${searchPNumber.toUpperCase()} ${searchLNumber}`);
    } else {
      setSearchMaterialCode('');
    }
  }, [searchBrand, searchPNumber, searchLNumber, brands]);

  // Search handler for Material Code
  const handleSearch = async () => {
    if (!searchMaterialCode) {
      customToast('error', 'Please select Brand, enter P-Number, and select L-Number to search.');
      return;
    }
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('MaterialCode', searchMaterialCode);
      params.append('page', currentPage);
      params.append('size', pageSize);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const response = await fetch(`http://localhost:8080/api/item/Search-Material-Code?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to search items');
      const data = await response.json();
      let content = data.content || data.data || data || [];
      setItems(Array.isArray(content) ? [...content] : []);
      setTotalItems(Array.isArray(content) ? content.length : 0);
      console.log('Search results:', content);
    } catch (error) {
      customToast('error', `Search failed: ${error.message}`);
      setItems([]);
      setTotalItems(0);
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset search fields and reload all items
  const handleClearSearch = () => {
    setSearchBrand('');
    setSearchPNumber('');
    setSearchLNumber('');
    setSearchMaterialCode('');
    fetchItems(currentPage, pageSize, sortBy, sortDir);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('DESC');

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchItems = useCallback(async (
  page = currentPage || 1,
  size = pageSize || 6,
  sortField = sortBy || 'id',
  sortDirection = sortDir || 'DESC'
) => {
  try {
    setLoading(true);
    // Ensure all params are numbers/strings, not undefined
    const safePage = page || 1;
    const safeSize = size || 6;
    const safeSortField = sortField || 'id';
    const safeSortDirection = sortDirection || 'DESC';

    console.log('Fetching items with params:', { safePage, safeSize, safeSortField, safeSortDirection });

    const response = await fetch(
      `http://localhost:8080/api/item/paginated?page=${safePage}&size=${safeSize}&sortBy=${safeSortField}&sortDir=${safeSortDirection}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch items'}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      // Handle different response structures
      if (data && typeof data === 'object') {
        const content = data.content || data.data || data || [];
        const pageNumber = data.pageNumber || data.page || page;
        const pageSize = data.pageSize || data.size || size;
        const totalElements = data.totalElements || data.total || content.length;
        
        // Force re-render by creating new array reference
        setItems(Array.isArray(content) ? [...content] : []);
        setCurrentPage(pageNumber);
        setPageSize(pageSize);
        setTotalItems(totalElements);
        
        // Update sorting state if different
        if (sortField !== sortBy) setSortBy(sortField);
        if (sortDirection !== sortDir) setSortDir(sortDirection);
        
        console.log('Items updated:', content.length);
      } else {
        console.warn('Unexpected response format:', data);
        setItems([]);
      }
      
    } catch (error) {
      console.error('Error fetching items:', error);
      customToast('error', `Failed to fetch items: ${error.message}`);
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch brands function
  const fetchBrands = useCallback(async () => {
    try {
      console.log('Fetching brands...');
      const response = await fetch('http://localhost:8080/api/brand', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Brands response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brands response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch brands'}`);
      }
      
      const data = await response.json();
      console.log('Fetched brands:', data);
      
      setBrands(Array.isArray(data) ? [...data] : []); // Force new array reference
    } catch (error) {
      console.error('Error fetching brands:', error);
      customToast('error', `Failed to fetch brands: ${error.message}`);
      setBrands([]);
    }
  }, []);

  useEffect(() => {
    console.log('Component mounted, fetching initial data...');
    fetchBrands();
    fetchItems(1, 6, 'id', 'DESC'); // Explicit initial values
  }, []); // Remove dependencies to prevent infinite loops

  useEffect(() => {
    if (selectedBrand && pNumber && lNumber) {
      const brandObj = brands.find(b => b.id.toString() === selectedBrand);
      setMaterialCode(
        `${brandObj ? brandObj.brandName : ''} ${pNumber.toUpperCase()} ${lNumber}`
      );
    } else {
      setMaterialCode('');
    }
  }, [selectedBrand, pNumber, lNumber, brands]);

  const handleTableChange = (pagination, filters, sorter) => {
    const newPage = pagination.current;
    const newSize = pagination.pageSize;
    
    let newSortBy = sortBy;
    let newSortDir = sortDir;
    
    if (sorter && sorter.field) {
      newSortBy = sorter.field;
      newSortDir = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setCurrentPage(newPage);
    setPageSize(newSize);
    setSortBy(newSortBy);
    setSortDir(newSortDir);

    fetchItems(newPage, newSize, newSortBy, newSortDir);
  };

  const handleEdit = (record) => {
    setIsUpdateMode(true);
    setEditingItem(record);
    setSelectedBrand(record.itemBrand.id.toString());
    const codeParts = record.itemCode.trim().split(' ');
    setPNumber(codeParts.length >= 2 ? codeParts[codeParts.length - 2] : '');
    setLNumber(codeParts.length >= 1 ? codeParts[codeParts.length - 1] : '');
    setMaterialCode(record.itemCode);
    setWholesaleAmount(record.wholesalePrice.toString());
    setRetailAmount(record.retailPrice.toString());
    setMaterialDescription(record.itemDescription);
  };

  const handleDelete = async (data) => {
    try {
      setLoading(true);
      console.log('Deleting item:', data.id);
      
      const res = await axios.delete(`http://localhost:8080/api/item/${data.id}`);
      console.log('Delete response:', res.data);
      
      if (!res.data || !res.data.id) {
        customToast('error', "Error When Deleting");
        return;
      }
      
      customToast('success', "Item Deleted Successfully");
      handleReset();
      
      // Calculate if we need to go to previous page
      const remainingItems = totalItems - 1;
      const maxPageAfterDelete = Math.ceil(remainingItems / pageSize);
      const targetPage = currentPage > maxPageAfterDelete ? Math.max(1, maxPageAfterDelete) : currentPage;
      
      console.log('Refreshing items after delete, target page:', targetPage);
      
      // Refresh the table data with a small delay to ensure backend is updated
      setTimeout(() => {
        fetchItems(targetPage, pageSize, sortBy, sortDir);
      }, 100);
      
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.data?.message?.includes("This item has associated GRN")) {
        customToast('error', `This item has associated GRN`);
      } else {
        customToast('error', `Error When Deleting: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!wholesaleAmount || !selectedBrand || !retailAmount || !pNumber || !lNumber) {
        return customToast('error', "All Fields Are Required");
      }
      
      let LnumberData = L_Number_List.find((data) => lNumber === data.code);
      if (!isUpdateMode || (editingItem && editingItem.itemCode !== materialCode)) {
        if (!LnumberData) return customToast('error', "Invalid L Number");
      }
      
      setLoading(true);
      console.log('Adding/updating item:', { isUpdateMode, materialCode });
      
      let response;
      if (isUpdateMode) {
        response = await axios.put('http://localhost:8080/api/item', {
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
        response = await axios.post('http://localhost:8080/api/item', {
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
      
      console.log('Add/Update response:', response.data);
      handleReset();
      
      // Refresh the table data with a small delay
      setTimeout(() => {
        fetchItems(currentPage, pageSize, sortBy, sortDir);
      }, 100);
      
    } catch (error) {
      console.error('Add/Update error:', error);
      if (error.response?.data?.message?.includes("Item already exists")) {
        customToast('error', "Item already exists with this code and brand");
      } else {
        customToast('error', `Something Went Wrong: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedBrand('');
    setPNumber('');
    setLNumber('');
    setMaterialCode('');
    setWholesaleAmount('');
    setRetailAmount('');
    setMaterialDescription('');
    setIsUpdateMode(false);
    setEditingItem(null);
  };

  const handleAddBrand = () => setCreateBrand(true);

  const handleDeleteBrand = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:8080/api/brand/${id}`);
      
      if (response.data?.id) {
        customToast('success', 'Brand Deleted Successfully');
        await fetchBrands(); // Refresh brands list
        if (selectedBrand === id.toString()) {
          setSelectedBrand('');
          setMaterialCode(''); // Reset material code if selected brand was deleted
        }
      } else {
        customToast('error', 'Error when deleting brand');
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data || error.message || 'Error deleting brand';
      customToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      title: 'Item Code', 
      dataIndex: 'itemCode', 
      key: 'itemCode', 
      sorter: true,
      width: 150
    },
    { 
      title: 'Brand', 
      dataIndex: ['itemBrand', 'brandName'], 
      key: 'brandName', 
      sorter: true,
      width: 120
    },
    { 
      title: 'Retail Price', 
      dataIndex: 'retailPrice', 
      key: 'retailPrice', 
      sorter: true,
      width: 120,
      render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-" 
    },
    { 
      title: 'Wholesale Price', 
      dataIndex: 'wholesalePrice', 
      key: 'wholesalePrice', 
      sorter: true,
      width: 130,
      render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-" 
    },
    { 
      title: 'Available Stock', 
      dataIndex: 'availableStock', 
      key: 'availableStock',
      width: 120
    },
    { 
      title: 'Stock (Liters)', 
      dataIndex: 'stockInLiters', 
      key: 'stockInLiters',
      width: 120,
      render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-" 
    },
    { 
      title: 'Stock (Millilitres)', 
      dataIndex: 'stockInMillilitres', 
      key: 'stockInMillilitres',
      width: 150,
      render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-"
    },
    {
      title: 'Action', 
      key: 'action', 
      width: 120,
      render: (_, record) => (
        <>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            size="small" 
            style={{ marginRight: 8, borderRadius: 50, padding: 15 }}
            loading={loading}
          />
          <Popconfirm
            title="Delete Item"
            description="Are you sure to delete this item ?"
            onConfirm={() => handleDelete(record)}
            okText="Confirm"
            cancelText="Cancel"
            okButtonProps={{ className: "custom-popconfirm-btn-ok" }}
            cancelButtonProps={{ className: "custom-popconfirm-btn-cancel" }}
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small" 
              style={{ borderRadius: 50, padding: 15 }}
              loading={loading}
            />
          </Popconfirm>
        </>
      ),
    },
  ];

  // Handler for when brand is created
  const handleBrandCreated = useCallback(async () => {
    await fetchBrands();
    setCreateBrand(false);
  }, [fetchBrands]);

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
      <div className="space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg">

        <div className="flex flex-col gap-5 w-full">
          <div className='flex flex-col w-full'>
            <label className='mb-1 text-white'>Select Brand</label>
            <div className="flex items-center gap-2 space-x-2">
              <Select
                value={selectedBrand || undefined}
                onChange={(value) => setSelectedBrand(value)}
                placeholder="Select Brand"
                className='!shadow-md border-0'
                style={{ flex: 1, height: 48, borderRadius: 9, background: '#fff', boxShadow: '0 2px 8px #f0f1f2', fontFamily: 'Poppins' }}
                loading={loading}
              >
                {brands.length === 0 && (
                  <Select.Option disabled key="no-brands">No Brands</Select.Option>
                )}
                {brands.map((brand) => (
                  <Select.Option value={brand.id.toString()} key={brand.id} className="custom-ant-option">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Poppins' }}>
                      <span>{brand.brandName}</span>
                      <Popconfirm
                        title="Delete Brand"
                        description="Are you sure to delete this brand ?"
                        onConfirm={e => { e.stopPropagation(); handleDeleteBrand(brand.id) }}
                        okText="Confirm"
                        cancelText="Cancel"
                        okButtonProps={{ className: "custom-popconfirm-btn-ok" }}
                        cancelButtonProps={{ className: "custom-popconfirm-btn-cancel" }}
                      >
                        <DeleteOutlined
                          style={{ color: 'red', marginLeft: 8 }}
                        />
                      </Popconfirm>
                    </div>
                  </Select.Option>
                ))}
              </Select>
              <button 
                onClick={handleAddBrand} 
                className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                +
              </button>
            </div>
          </div>

          <div className='flex flex-col w-full'>
            <label className='mb-1 text-white'>Product Code</label>
            <input
              type="text"
              placeholder="Enter P Number (e.g. P001)"
              value={pNumber}
              onChange={(e) => setPNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
              disabled={loading}
            />
          </div>

          <div className='flex flex-col w-full'>
            <label className='mb-1 text-white'>Product Name</label>
            <Select
              value={lNumber || undefined}
              onChange={(value) => setLNumber(value)}
              placeholder="Select L Number"
              className='!shadow-md border-0'
              style={{ width: '100%', height: 48, borderRadius: 9, background: '#fff', boxShadow: '0 2px 8px #f0f1f2', fontFamily: 'Poppins' }}
              loading={loading}
            >
              {L_Number_List.map((l) => (
                <Select.Option value={l.code} key={l.code}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Poppins' }}>
                  {l.code} ({l.pack_size} {l.pack_unit})
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Material Code (read-only) */}
        <div className='flex flex-col w-full'>
          <label className='mb-1 text-white'>Material Code</label>
          <input
            type="text"
            value={materialCode}
            readOnly
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-gray-100"
          />
        </div>

        {/* Price Inputs Row */}
        <div className="flex flex-col gap-5">

          <div className="flex flex-col w-full">
             <label className="mb-1 text-white">Wholesale Amount</label>
          <InputNumber
            value={wholesaleAmount ? Number(wholesaleAmount) : null}
            onChange={(value) => setWholesaleAmount(value)}
            formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            className="w-full"
            style={{
                width: "100%", 
                height: 48,
                borderRadius: 12,
                fontFamily: "Poppins, sans-serif",
                fontSize: 16 }}
            inputStyle={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 16,
               }}
            disabled={loading}
              />
            </div>

          <div className="flex flex-col w-full">
             <label className="mb-1 text-white">Retail Amount</label>
          <InputNumber
             value={retailAmount ? Number(retailAmount) : null}
             onChange={(value) => setRetailAmount(value)}
             formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
             parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
             className="w-full px-4 py-3 rounded-lg shadow-md border-0 bg-white"
             style={{
              width: "100%", 
              height: 48,
              borderRadius: 12,
              fontFamily: "Poppins, sans-serif",
              fontSize: 16 }}
              inputStyle={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 16 }}
              disabled={loading}
              />
           </div>
          </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleAddItem}
            className="px-6 py-3 w-[200px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isUpdateMode ? 'Save Changes' : 'Add Item')}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 w-[120px] bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {isUpdateMode ? 'Cancel' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="mb-8 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-wrap gap-4 items-end">
          {/* Brand Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Brand</label>
            <Select
              showSearch
              placeholder="Select Brand"
              value={searchBrand || undefined}
              onChange={setSearchBrand}
              style={{ width: 180 }}
              allowClear
              options={brands.map(b => ({ value: b.id.toString(), label: b.brandName }))}
            />
          </div>
          {/* P-Number Input */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">P-Number</label>
            <input
              type="text"
              placeholder="Enter P-Number"
              value={searchPNumber}
              onChange={e => setSearchPNumber(e.target.value)}
              className="w-[180px] h-[33px] text-sm px-3 py-2 rounded shadow border border-gray-300 text-gray-700"
            />
          </div>
          {/* L-Number Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">L-Number</label>
            <Select
              showSearch
              placeholder="Select L-Number"
              value={searchLNumber || undefined}
              onChange={setSearchLNumber}
              style={{ width: 150 }}
              allowClear
              options={L_Number_List.map(l => ({ value: l.code, label: `${l.code} (${l.pack_size} ${l.pack_unit})` }))}
            />
          </div>
          {/* Search & Clear Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              style={{
                backgroundColor: '#FC890D',
                color: '#fff',
                borderRadius: '6px',
                padding: '0 16px',
                height: '33px',
                fontWeight: 400,
                fontFamily: 'Poppins',
                fontSize: '14px',
                boxShadow: '0 2px 8px #f0f1f2',
                border: 'none',
                cursor: searchLoading ? 'not-allowed' : 'pointer',
                opacity: searchLoading ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#FD9A2E'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#FC890D'}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleClearSearch}
              style={{
                backgroundColor: '#AAA69F',
                color: '#fff',
                borderRadius: '6px',
                padding: '0 16px',
                height: '33px',
                fontWeight: 400,
                fontFamily: 'Poppins',
                fontSize: '14px',
                boxShadow: '0 2px 8px #f0f1f2',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#646363'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#AAA69F'}
            >
              Clear
            </button>
          </div>
        </div>
        {/* Material Code Preview */}
        <div className="mt-5 flex flex-col w-[400px]">
          <label className="mb-1 text-sm font-medium text-white">Material Code (Combined)</label>
          <input
            type="text"
            value={searchMaterialCode}
            readOnly
            className="w-full px-4 py-2 rounded shadow border border-gray-200 bg-gray-100"
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl text-white font-bold mb-4">Items List</h2>
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,     
            total: totalItems,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          onChange={handleTableChange}
          size="large"
          className="text-base"
          scroll={{ x: 1000 }}
         />
      </div>

      {/* Create Brand Modal */}
      {showCreateBrand && (
        <CreateBrand
          fetchBrands={handleBrandCreated}
          setCreateBrand={setCreateBrand}
        />
      )}
    </MainLayout>
  );
}