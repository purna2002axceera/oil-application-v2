'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Popconfirm, InputNumber, Select, Spin, Flex } from 'antd';
import { EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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
  const [mounted, setMounted] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('DESC');

  // Memoized fetch function to support search only
  const fetchItems = useCallback(async (
  page = currentPage || 1,
  size = pageSize || 6,
  sortField = sortBy || 'id',
  sortDirection = sortDir || 'DESC',
  search = searchText
) => {
  try {
    setLoading(true);
    let url = '';
    if (search) {
      url = `http://localhost:8080/api/item/Search-Material-Code?MaterialCode=${encodeURIComponent(search)}&page=${page}&size=${size}&sortBy=${sortField}&sortDir=${sortDirection}`;
    } else {
      url = `http://localhost:8080/api/item/paginated?page=${page}&size=${size}&sortBy=${sortField}&sortDir=${sortDirection}`;
    }
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch items'}`);
    }
    const data = await response.json();
    if (data && typeof data === 'object') {
      const content = data.content || data.data || data || [];
      const pageNumber = data.pageNumber || data.page || page;
      const pageSize = data.pageSize || data.size || size;
      const totalElements = data.totalElements || data.total || content.length;
      setItems(Array.isArray(content) ? [...content] : []);
      setCurrentPage(pageNumber);
      setPageSize(pageSize);
      setTotalItems(totalElements);
      if (sortField !== sortBy) setSortBy(sortField);
      if (sortDirection !== sortDir) setSortDir(sortDirection);
    } else {
      setItems([]);
    }
  } catch (error) {
    customToast('error', `Failed to fetch items: ${error.message}`);
    setItems([]);
    setTotalItems(0);
  } finally {
    setLoading(false);
  }
}, [currentPage, pageSize, sortBy, sortDir, searchText]);

  useEffect(() => {
    setMounted(true);
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
    fetchItems(1, 6, 'id', 'DESC', ''); // Explicit initial values
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
    fetchItems(newPage, newSize, newSortBy, newSortDir, searchText);
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
        fetchItems(targetPage, pageSize, sortBy, sortDir, searchText);
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
        fetchItems(currentPage, pageSize, sortBy, sortDir, searchText);
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
        setSelectedBrand('');
        await fetchBrands(); 
        if (selectedBrand === id.toString()) {
          setSelectedBrand('');
          setMaterialCode(''); 
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
      title: 'Date',
      dataIndex: 'createdDateTime',
      key: 'createdDateTime',
      width: 100,
      sorter: (a, b) =>
        new Date(a.createdDateTime).getTime() - new Date(b.createdDateTime).getTime(),
      render: (value) => {
        const date = new Date(value);
        return date.toISOString().split('T')[0]; // shows YYYY-MM-DD
      },
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
        className="text-2xl font-bold mb-6 w-full py-4 px-6"
        style={{
          background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)',
          color: '#515151'
        }}
      >
        {isUpdateMode ? 'Update Item' : 'Create Item'}
      </h1>

      {/* Form Section */}
     { mounted && <div className="space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg">

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
                disabled={isUpdateMode}
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
                className="w-8 h-8 bg-black cursor-pointer text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-[#6B6B6B] transition-colors"
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
              disabled={loading || isUpdateMode}
            />
          </div>

          <div className='flex flex-col w-full'>
            <label className='mb-1 text-white'>Product Name</label>
            <Select
              value={lNumber || undefined}
              onChange={(value) => setLNumber(value)}
              disabled={isUpdateMode}
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
                display: 'flex',
                alignItems: 'center',
                borderRadius: 7,
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
             className="w-full px-4 py-3 rounded-sm shadow-md border-0 bg-white"
             style={{
              width: "100%", 
              height: 48,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 7,
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
            className="px-6 py-3 w-[200px] cursor-pointer bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isUpdateMode ? 'Save Changes' : 'Add Item')}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 w-[120px] cursor-pointer bg-[#6B6B6B] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {isUpdateMode ? 'Cancel' : 'Reset'}
          </button>
        </div>
      </div> }

    { mounted && (
      <div className="mt-12 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Filter Items</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-700">Search by Material Code</label>
              <Input.Search
                placeholder="Enter Material Code"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onSearch={() => { setCurrentPage(1); fetchItems(1, pageSize, sortBy, sortDir, searchText); }}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                allowClear
              />
            </div>
            <Button onClick={() => { setSearchText(''); setCurrentPage(1); fetchItems(1, pageSize, sortBy, sortDir, ''); }} style={{ height: 32 }}>
              Clear
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {searchText ? (
              <p>matching "{searchText}"</p>
            ) : (
              <p>Showing all {totalItems} items</p>
            )}
          </div>
        </div>
      </div>
    )}

    { mounted && <div className="mt-8">
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
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSizeOptions: ['5', '10', '20', '50', '100'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
              fetchItems(page, size, sortBy, sortDir, searchText);
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(1);
              setPageSize(size);
              fetchItems(1, size, sortBy, sortDir, searchText);
            }
          }}
          onChange={handleTableChange}
          size="large"
          className="text-base"
          scroll={{ x: 1000 }}
         />
      </div> }

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