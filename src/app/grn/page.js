'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, Form, Input, InputNumber, Popconfirm, Typography, DatePicker, Space } from 'antd'

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const page = () => {
    const [form] = Form.useForm();
    const [grnNumber, setGrnNumber] = useState('')
    const [supplierName, setSupplierName] = useState('')
    const [items, setItems] = useState([])
    const [quantity, setQuantity] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [itemUnitPrice, setItemUnitPrice] = useState('')
    const [totalPrice, setTotalPrice] = useState('')
    const [grnItems, setGrnItems] = useState([])
    const [grandTotal, setGrandTotal] = useState(0)
    const [allGrns, setAllGrns] = useState([])
    const [editingKey, setEditingKey] = useState('');

    // Updated state for filters and pagination with single date
    const [filteredGrns, setFilteredGrns] = useState([])
    const [searchText, setSearchText] = useState('')
    const [selectedDate, setSelectedDate] = useState(null) // Changed from dateRange to selectedDate
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

  const getCurrentGrnNumber = async () => {
    try {
       const res = await axios.get(`http://localhost:8080/api/grn/last-number`)
       const data = res.data
       
       if (data && data.trim() !== '') {
         const parts = data.split('-')
         if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
           const lastNumber = parseInt(parts[2])
           const newNumber = lastNumber + 1
           const year = new Date().getFullYear()
           const formattedNumber = `GRN-${year}-${String(newNumber).padStart(3, '0')}`
           setGrnNumber(formattedNumber)
         } else {
           // Invalid format, set initial number
           const year = new Date().getFullYear()
           const initialNumber = `GRN-${year}-001`
           setGrnNumber(initialNumber)
         }
       } else {
         // No data, set initial number
         const year = new Date().getFullYear()
         const initialNumber = `GRN-${year}-001`
         setGrnNumber(initialNumber)
       }
       
       console.log('GRN Number:', grnNumber)
    } catch (error) {
        console.log('Error fetching GRN number:', error)
        // If API call fails, set initial number
        const year = new Date().getFullYear()
        const initialNumber = `GRN-${year}-001`
        setGrnNumber(initialNumber)
        console.log('Set initial GRN number:', initialNumber)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/item');
      const data = await response.json();
      console.log("items",data);
      
      setItems(data);
      console.log(data)
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchAllGrns = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/grn');
      const data = await response.json();
      const grnData = data.map(grn => {
        const formattedCreatedAt = grn.createdAt.split('T')[0]
        return {
          ...grn,
          createdAt: formattedCreatedAt,
          key: grn.id.toString(),
          items: grn.items.map((item, index) => ({
            ...item,
            key: `${grn.id}-${item.id || index}`,
            itemName: getItemName(item.itemId) || `Item ${item.itemId}`
          }))
        }
      })
      console.log('created at:', grnData)
      setAllGrns(grnData);
      console.log('All GRNs:', data)
    } catch (error) {
      console.error('Error fetching GRNs:', error);
    }
  };

  // Updated filter function for single date
  const applyFilters = () => {
    let filtered = [...allGrns]

    // Filter by GRN Number search
    if (searchText.trim()) {
      filtered = filtered.filter(grn => 
        grn.grnNumber.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Filter by single date
    if (selectedDate) {
      filtered = filtered.filter(grn => {
        const grnDate = new Date(grn.createdAt)
        const filterDate = selectedDate.startOf('day')
        const grnDateFormatted = grnDate.toISOString().split('T')[0]
        const filterDateFormatted = filterDate.format('YYYY-MM-DD')
        return grnDateFormatted === filterDateFormatted
      })
    }

    setFilteredGrns(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  useEffect(() => {
    getCurrentGrnNumber()
    fetchItems()
    fetchAllGrns()
  }, [])

  useEffect(() => {
    autoCalculateTotalPrice()
  }, [quantity, itemUnitPrice])

  useEffect(() => {
    calculateGrandTotal()
  }, [grnItems])

  // Apply filters whenever search text, selected date, or allGrns change
  useEffect(() => {
    applyFilters()
  }, [searchText, selectedDate, allGrns]) // Changed from dateRange to selectedDate

  const autoCalculateTotalPrice = () => {
    if (quantity && itemUnitPrice) {
      setTotalPrice(parseFloat(quantity) * parseFloat(itemUnitPrice))
    } else {
      setTotalPrice('')
    }
  }

  const calculateGrandTotal = () => {
    const total = grnItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
    setGrandTotal(total)
  }

  const getItemName = (itemId) => {
    const item = items.find(item => item.id == itemId)
    return item ? `${item.itemBrand.brandName} - ${item.itemCode}` : ''
  }

  const resetForm = () => {
    setSupplierName('')
    setQuantity('')
    setSelectedItem('')
    setItemUnitPrice('')
    setTotalPrice('')
  }

  const resetAll = () => {
    resetForm()
    setGrnItems([])
    setGrandTotal(0)
    getCurrentGrnNumber()
  }

  const handleAddItem = () => {
    if (!selectedItem || !supplierName || !quantity || !itemUnitPrice) {
      customToast('error', 'Please fill all fields')
      return
    }

    const newItem = {
      itemId: parseInt(selectedItem),
      itemName: getItemName(selectedItem),
      supplier_name: supplierName,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(itemUnitPrice),
      totalPrice: parseFloat(totalPrice),
      createdAt: new Date().toISOString().slice(0, 19)
    }

    const existingItem = grnItems.find(item => item.itemId === parseInt(selectedItem))
    if (existingItem) {
      customToast('error', 'Item already added')
      return
    }

    // Always add as new item since update removes the original from table
    setGrnItems([...grnItems, newItem])
    customToast('success', 'Item added successfully')

    resetForm()
  }

  const handleRemoveItem = (index) => {
    const updatedItems = grnItems.filter((_, i) => i !== index)
    setGrnItems(updatedItems)
    customToast('success', 'Item removed successfully')
  }

  const handleUpdateItem = (index) => {
    const item = grnItems[index]
    setSelectedItem(item.itemId.toString())
    setSupplierName(item.supplier_name)
    setQuantity(item.quantity.toString())
    setItemUnitPrice(item.unitPrice.toString())
    setTotalPrice(item.totalPrice.toString())
    
    // Remove the item from the table
    const updatedItems = grnItems.filter((_, i) => i !== index)
    setGrnItems(updatedItems)
  }

  const handleCreateGRN = async () => {
    if (grnItems.length === 0) {
      customToast('error', 'Please add at least one item')
      return
    }

    const grnData = {
      grnNumber: grnNumber,
      totalAmount: grandTotal,
      createdAt: new Date().toISOString().slice(0, 19),
      items: grnItems.map(item => ({
        grnId: 0,
        itemId: item.itemId,
        supplier_name: item.supplier_name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        createdAt: item.createdAt
      }))
    }

    try {
      const response = await axios.post('http://localhost:8080/api/grn', grnData)
      customToast('success', 'GRN created successfully')
      resetAll()
      fetchAllGrns() // Refresh the GRNs list
    } catch (error) {
      customToast('error', `Error creating GRN: ${error.message}`)
    }
  }

  const handleDeleteGrn = async (grnId) => {
    try {
        console.log("delete grn",grnId)
      const response = await axios.delete(`http://localhost:8080/api/grn/${grnId}`)
      customToast('success', 'GRN deleted successfully')
      fetchAllGrns() // Refresh the GRNs list
    } catch (error) {
      customToast('error', `Error deleting GRN: ${error.message}`)
    }
  }

  const handleSearch = (value) => {
    setSearchText(value)
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  const clearFilters = () => {
    setSearchText('')
    setSelectedDate(null) // Changed from dateRange to selectedDate
    setCurrentPage(1)
  }

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  // Editable functions for nested table
  const isEditing = (record) => record.key === editingKey;

  const nestedColumns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      editable: true,
    },
    {
      title: 'Item ID',
      dataIndex: 'itemId',
      key: 'itemId',
      editable: false,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
    },
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
      editable: true,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price) => `LKR ${parseFloat(price || 0).toFixed(2)}`,
      editable: true,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount, record) => `LKR ${parseFloat(amount || record.totalPrice || 0).toFixed(2)}`,
      editable: true,
    }
  ];

  const mergedNestedColumns = nestedColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: ['quantity', 'unitPrice', 'totalAmount'].includes(col.dataIndex) ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  // Main table columns
  const mainColumns = [
    {
      title: 'GRN Number',
      dataIndex: 'grnNumber',
      key: 'grnNumber',
      width: '20%',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '20%',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '20%',
      render: (amount) => `LKR ${parseFloat(amount || 0).toFixed(2)}`,
    },
    {
      title: 'Items Count',
      key: 'itemsCount',
      width: '20%',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Action',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Button 
          type="primary" 
          danger
          icon={<DeleteOutlined />} 
          onClick={() => handleDeleteGrn(record.id)}
          size="small"
        />
      ),
    }
  ];

  const expandedRowRender = (record) => (
    <Form form={form} component={false}>
      <Table
        components={{
          body: { cell: EditableCell },
        }}
        bordered
        dataSource={record.items}
        columns={mergedNestedColumns}
        pagination={false}
        size="small"
        rowClassName="editable-row"
      />
    </Form>
  );

  return (
     <MainLayout>
         <h1  className="text-2xl font-bold mb-6 w-full py-4 px-6 rounded-lg" 
          style={{  background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)',  color: '#515151' }}
         >
            Good Receive Notice
        </h1>
          {/* Form Section */}
 
       <div className="space-y-4 gap-5 flex w-full">
        
         <div className="flex w-full flex-col gap-1">
           <label className='mb-1'>GRN Number</label>
             <input
               type="text"
               placeholder="GRN Number"
               disabled
               value={ grnNumber }
               className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
             />
        </div>
        <div className="flex w-full flex-col gap-1">
        <label className='mb-1'>Supplier Name</label>
        <input
          type="text"
          placeholder="Supplier Name"
          onChange={(e) => setSupplierName(e.target.value)}
          value={ supplierName }
          className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
         />
    </div>
</div>

<div className="space-y-4 gap-5 flex w-full"> 
        <div className="flex w-full flex-col gap-1">
          <label className='mb-1'>Select Item</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
          >
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.itemBrand.brandName} - {item.itemCode}</option>
            ))}
          </select>
       </div>
       <div className="flex w-full flex-col gap-1">
        <label className='mb-1'>Quantity</label>
       <input
         type="number"
         placeholder="Quantity" 
         onChange={(e) => setQuantity(e.target.value)}
         value={ quantity }
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
        />
   </div>
 
</div>

<div className="space-y-4 gap-5 flex w-full"> 
<div className="flex w-full flex-col gap-1">
    <label className='mb-1'>Item Unit Price</label>
       <input
         type="number"
         step="0.01"
         placeholder="Item Unit Price" 
         onChange={(e) => setItemUnitPrice(e.target.value)}
         value={ itemUnitPrice }
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
        />
   </div>
       <div className="flex w-full flex-col gap-1">
        <label className='mb-1'>Total Price</label>
       <input
         type="number"
         step="0.01"
         placeholder="Total Price" 
         value={ totalPrice }
         disabled
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-gray-100"
        />
   </div>
 
</div>

{/* Action Buttons */}
<div className="flex gap-4 mt-6">
  <button
    type="button"
    onClick={resetForm}
    className="px-6 py-3 bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#968D86] transition-colors"
  >
    Cancel
  </button>
  <button
    type="button"
    onClick={handleAddItem}
    className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#FD9A2E] transition-colors"
  >
    Add Item
  </button>
</div>

{/* Items Table */}
{grnItems.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold mb-4">Added Items</h2>
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Supplier</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Price</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {grnItems.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{item.supplier_name}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.unitPrice.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.totalPrice.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleUpdateItem(index)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit"
                  >
                    <EditOutlined />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900">Grand Total:</td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">{grandTotal.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)}

{/* Final Action Buttons */}
{ grnItems.length > 0 && <div className="flex gap-4 mt-8">
  <button
    type="button"
    onClick={resetAll}
    className="px-6 py-3 bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#968D86] transition-colors"
  >
    Reset
  </button>
  <button
    type="button"
    onClick={handleCreateGRN}
    className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#FD9A2E] transition-colors"
  >
    Create GRN
  </button>
</div> }

{/* Updated Filter Section with Single Date */}
<div className="mt-12 mb-6">
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Filter GRNs</h3>
    <div className="flex flex-wrap gap-4 items-end">
      {/* Search by GRN Number */}
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-700">Search by GRN Number</label>
        <Input.Search
          placeholder="Enter GRN Number"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 250 }}
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>

      {/* Single Date Filter */}
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-700">Filter by Date</label>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          style={{ width: 200 }}
          format="YYYY-MM-DD"
          placeholder="Select Date"
          prefix={<CalendarOutlined />}
        />
      </div>

      {/* Clear Filters Button */}
      <Button 
        onClick={clearFilters}
        style={{ height: 32 }}
      >
        Clear Filters
      </Button>
    </div>

    {/* Updated Filter Results Summary */}
    <div className="mt-4 text-sm text-gray-600">
      {searchText || selectedDate ? (
        <p>
          Showing {filteredGrns.length} of {allGrns.length} GRNs
          {searchText && ` matching "${searchText}"`}
          {selectedDate && ` created on ${selectedDate.format('YYYY-MM-DD')}`}
        </p>
      ) : (
        <p>Showing all {allGrns.length} GRNs</p>
      )}
    </div>
  </div>
</div>

{/* All GRNs Expandable Table with Enhanced Pagination */}
<div className="mt-6">
  <h2 className="text-xl font-bold mb-4">All GRNs</h2>
  <Table 
    columns={mainColumns}
    dataSource={filteredGrns}
    expandable={{
      expandedRowRender,
      defaultExpandedRowKeys: [],
      columnWidth: "100px",
    }}
    pagination={{
      current: currentPage,
      pageSize: pageSize,
      total: filteredGrns.length,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => 
        `${range[0]}-${range[1]} of ${total} items`,
      pageSizeOptions: ['5', '10', '20', '50', '100'],
      onChange: (page, size) => {
        setCurrentPage(page)
        setPageSize(size)
      },
      onShowSizeChange: (current, size) => {
        setCurrentPage(1)
        setPageSize(size)
      }
    }}
    size="large"
    className="text-base"
    bordered
    onChange={handleTableChange}
  />
</div>

    </MainLayout>

  )
}

export default page