'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, Form, Input, InputNumber, DatePicker, Select, Modal } from 'antd'

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
    const [editForm] = Form.useForm();
    const [grnNumber, setGrnNumber] = useState('')
    const [supplierName, setSupplierName] = useState('')
    const [items, setItems] = useState([])
    const [quantity, setQuantity] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [itemUnitPrice, setItemUnitPrice] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [totalPrice, setTotalPrice] = useState('')
    const [grnItems, setGrnItems] = useState([])
    const [grandTotal, setGrandTotal] = useState(0)
    const [allGrns, setAllGrns] = useState([])
    const [editingKey, setEditingKey] = useState('');
    
    // Edit modal states
    const [isEditModalVisible, setIsEditModalVisible] = useState(false)
    const [editingGrn, setEditingGrn] = useState(null)
    const [editGrnItems, setEditGrnItems] = useState([])
    const [editGrandTotal, setEditGrandTotal] = useState(0)

    // Updated state for filters and pagination with single date
    const [filteredGrns, setFilteredGrns] = useState([])
    const [searchText, setSearchText] = useState('')
    const [selectedDate, setSelectedDate] = useState(null)
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
           const formattedNumber = `PO-${year}-${String(newNumber).padStart(3, '0')}`
           setGrnNumber(formattedNumber)
         } else {
           const year = new Date().getFullYear()
           const initialNumber = `PO-${year}-001`
           setGrnNumber(initialNumber)
         }
       } else {
         const year = new Date().getFullYear()
         const initialNumber = `PO-${year}-001`
         setGrnNumber(initialNumber)
       }
       
       console.log('GRN Number:', grnNumber)
    } catch (error) {
        console.log('Error fetching GRN number:', error)
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

  const applyFilters = () => {
    let filtered = [...allGrns]

    if (searchText.trim()) {
      filtered = filtered.filter(grn => 
        grn.grnNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        grn.invoiceNumber.toLowerCase().includes(searchText.toLowerCase())
      )
    }

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
    setCurrentPage(1)
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

  useEffect(() => {
    calculateEditGrandTotal()
  }, [editGrnItems])

  useEffect(() => {
    // Only apply local filters if searchText is empty (not using API search)
    if (!searchText || searchText.trim() === '') {
      applyFilters();
    }
  }, [searchText, selectedDate, allGrns])

  const handleSelectItem = (val) =>{
    setSelectedItem(val)
    const selectedItem = items.find(item=>item.id === val)
    setItemUnitPrice(selectedItem.wholesalePrice)
  }

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

  const calculateEditGrandTotal = () => {
    const total = editGrnItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
    setEditGrandTotal(total)
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
    setInvoiceNumber('')
    getCurrentGrnNumber()
  }

  const handleAddItem = () => {
    if (!selectedItem || !supplierName || !quantity || !itemUnitPrice || !invoiceNumber) {
      customToast('error', 'Please fill all fields including invoice number')
      return
    }

    const newItem = {
      itemId: parseInt(selectedItem),
      itemName: getItemName(selectedItem),
      supplier_name: supplierName,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(itemUnitPrice),
      totalPrice: parseFloat(totalPrice),
      invoiceNumber: invoiceNumber,
      createdAt: new Date().toISOString().slice(0, 19)
    }

    const existingItem = grnItems.find(item => item.itemId === parseInt(selectedItem))
    if (existingItem) {
      customToast('error', 'Item already added')
      return
    }

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
    setInvoiceNumber(item.invoiceNumber)
    
    const updatedItems = grnItems.filter((_, i) => i !== index)
    setGrnItems(updatedItems)
  }

  const handleCreateGRN = async () => {
    if (grnItems.length === 0) {
      customToast('error', 'Please add at least one item')
      return
    }

    if (!invoiceNumber) {
      customToast('error', 'Please enter invoice number')
      return
    }

    const grnData = {
      grnNumber: grnNumber,
      invoiceNumber: invoiceNumber,
      totalAmount: grandTotal,
      createdAt: new Date().toISOString().slice(0, 19),
      items: grnItems.map(item => ({
        grnId: 0,
        itemId: item.itemId,
        supplier_name: item.supplier_name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        invoiceNumber: item.invoiceNumber,
        createdAt: item.createdAt
      }))
    }

    try {
      const response = await axios.post('http://localhost:8080/api/grn', grnData)
      customToast('success', 'GRN created successfully')
      resetAll()
      fetchAllGrns()
    } catch (error) {
      customToast('error', `Error creating GRN: ${error.message}`)
    }
  }

  const handleDeleteGrn = async (grnId) => {
    try {
        console.log("delete grn",grnId)
      const response = await axios.delete(`http://localhost:8080/api/grn/${grnId}`)
      customToast('success', 'GRN deleted successfully')
      fetchAllGrns()
    } catch (error) {
      customToast('error', `Error deleting GRN: ${error.message}`)
    }
  }

  // Edit GRN functions
  const handleEditGrn = (record) => {
    setEditingGrn(record)
    setEditGrnItems([...record.items])
    setIsEditModalVisible(true)
    editForm.setFieldsValue({
      grnNumber: record.grnNumber,
      invoiceNumber: record.invoiceNumber,
      totalAmount: record.totalAmount
    })
  }

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false)
    setEditingGrn(null)
    setEditGrnItems([])
    setEditGrandTotal(0)
    editForm.resetFields()
  }

  const handleAddEditItem = (values) => {
    if (!values.selectedItem || !values.supplierName || !values.quantity || !values.unitPrice || !values.invoiceNumber) {
      customToast('error', 'Please fill all fields')
      return
    }

    const newItem = {
      itemId: parseInt(values.selectedItem),
      itemName: getItemName(values.selectedItem),
      supplier_name: values.supplierName,
      quantity: parseInt(values.quantity),
      unitPrice: parseFloat(values.unitPrice),
      totalPrice: parseFloat(values.quantity) * parseFloat(values.unitPrice),
      invoiceNumber: values.invoiceNumber,
      createdAt: new Date().toISOString().slice(0, 19)
    }

    const existingItemIndex = editGrnItems.findIndex(item => item.itemId === parseInt(values.selectedItem))
    if (existingItemIndex !== -1) {
      const updatedItems = [...editGrnItems]
      updatedItems[existingItemIndex] = newItem
      setEditGrnItems(updatedItems)
    } else {
      setEditGrnItems([...editGrnItems, newItem])
    }

    editForm.resetFields(['selectedItem', 'supplierName', 'quantity', 'unitPrice', 'invoiceNumber'])
    customToast('success', 'Item added successfully')
  }

  const handleRemoveEditItem = (index) => {
    const updatedItems = editGrnItems.filter((_, i) => i !== index)
    setEditGrnItems(updatedItems)
    customToast('success', 'Item removed successfully')
  }

  const handleUpdateEditItem = (index) => {
    const item = editGrnItems[index]
    editForm.setFieldsValue({
      selectedItem: item.itemId,
      supplierName: item.supplier_name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      invoiceNumber: item.invoiceNumber
    })
    
    const updatedItems = editGrnItems.filter((_, i) => i !== index)
    setEditGrnItems(updatedItems)
  }

  const handleUpdateGRN = async () => {
    try {
      const values = editForm.getFieldsValue()
      
      if (!values.invoiceNumber) {
        customToast('error', 'Please enter invoice number')
        return
      }

      if (editGrnItems.length === 0) {
        customToast('error', 'Please add at least one item')
        return
      }

      const updatedGrnData = {
        id: editingGrn.id,
        grnNumber: values.grnNumber,
        invoiceNumber: values.invoiceNumber,
        totalAmount: editGrandTotal,
        createdAt: editingGrn.createdAt,
        items: editGrnItems.map(item => ({
          grnId: editingGrn.id,
          itemId: item.itemId,
          supplier_name: item.supplier_name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          invoiceNumber: item.invoiceNumber,
          createdAt: item.createdAt
        }))
      }

      const response = await axios.put(`http://localhost:8080/api/grn/${editingGrn.id}`, updatedGrnData)
      customToast('success', 'GRN updated successfully')
      setIsEditModalVisible(false)
      setEditingGrn(null)
      setEditGrnItems([])
      setEditGrandTotal(0)
      editForm.resetFields()
      fetchAllGrns()
    } catch (error) {
      customToast('error', `Error updating GRN: ${error.message}`)
    }
  }


  // Fetch GRNs from search API
  const fetchSearchGrns = async (searchValue) => {
    try {
      const params = new URLSearchParams();
      if (searchValue) {
        if (searchValue.toUpperCase().startsWith('INV')) {
          params.append('invoiceNumber', searchValue);
        } else if (searchValue.toUpperCase().startsWith('PO')) {
          params.append('grnNumber', searchValue);
        } else {
          // fallback: search both
          params.append('grnNumber', searchValue);
          params.append('invoiceNumber', searchValue);
        }
      }
      params.append('page', '1');
      params.append('size', pageSize.toString());
      params.append('sortBy', 'createdAt');
      params.append('sortDir', 'desc');

      const response = await fetch(`http://localhost:8080/api/grn/search?${params.toString()}`);
      const data = await response.json();
      let grnArray = [];
      if (Array.isArray(data)) {
        grnArray = data;
      } else if (data && Array.isArray(data.content)) {
        grnArray = data.content;
      } else if (data && data.data && Array.isArray(data.data)) {
        grnArray = data.data;
      } else {
        setFilteredGrns([]);
        setCurrentPage(1);
        return;
      }
      const grnData = grnArray.map(grn => {
        const formattedCreatedAt = grn.createdAt?.split('T')[0] || '';
        return {
          ...grn,
          createdAt: formattedCreatedAt,
          key: grn.id?.toString() || Math.random().toString(),
          items: (grn.items || []).map((item, index) => ({
            ...item,
            key: `${grn.id || 'x'}-${item.id || index}`,
            itemName: getItemName(item.itemId) || `Item ${item.itemId}`
          }))
        }
      });
      setFilteredGrns(grnData);
      setCurrentPage(1);
    } catch (error) {
      customToast('error', 'Error searching GRNs');
      console.error('Error searching GRNs:', error);
    }
  }

  // Update search to use API
  const handleSearch = (value) => {
    let searchValue = value;
    // If called from button click, value will be event, so use searchText from state
    if (value && value.target) {
      searchValue = searchText;
    }
    setSearchText(searchValue);
    if (typeof searchValue === 'string' && searchValue.trim() !== '') {
      fetchSearchGrns(searchValue.trim());
    } else {
      applyFilters();
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  const clearFilters = () => {
    setSearchText('')
    setSelectedDate(null)
    setCurrentPage(1)
  }

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  // Editable functions for nested table
  const isEditing = (record) => record.key === editingKey;

  const nestedColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', editable: true },
    { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', editable: false },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', editable: true },
    { title: 'Supplier Name', dataIndex: 'supplierName', key: 'supplierName', editable: true },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-", editable: true },
    { title: 'Total Price', dataIndex: 'totalAmount', key: 'totalAmount', render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-", editable: true },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', editable: false },
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
    { title: 'Purchase Number', dataIndex: 'grnNumber', key: 'grnNumber', width: '25%' },
    { title: 'Invoice Number', dataIndex: 'invoiceNumber', key: 'invoiceNumber', width: '20%' },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', width: '20%' },
    { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', width: '10%', render: (value) => value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "-" },
    { title: 'Items Count', key: 'itemsCount', width: '8%', render: (_, record) => record.items?.length || 0 },
    { title: 'Action', key: 'action', width: '18%', render: (_, record) => (
      <div className="flex gap-2">
        <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDeleteGrn(record.id)} size="small" />
      </div>
    ) },
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
            Purchase Order
        </h1>
          {/* Form Section */}
      <div className='space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg'>
       <div className="flex w-full flex-col gap-1">
           <label className='mb-1 text-white'>Purchase Order Number</label>
             <input
               type="text"
               placeholder="Purchase Order Number"
               disabled
               value={ grnNumber }
               className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
             />
        </div>

        <div className="flex w-full flex-col gap-1">
           <label className='mb-1 text-white'>Invoice Number *</label>
             <input
               type="text"
               placeholder="Invoice Number"
               onChange={(e)=> setInvoiceNumber(e.target.value)}
               value={ invoiceNumber }
               className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
               required
             />
        </div>
        <div className="flex w-full flex-col gap-1">
        <label className='mb-1 text-white'>Supplier Name</label>
        <input
          type="text"
          placeholder="Supplier Name"
          onChange={(e) => setSupplierName(e.target.value)}
          value={ supplierName }
          className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
         />
        </div>

        <div className="flex w-full flex-col gap-1">
          <label className='mb-1 text-white'>Select Item</label>
          <Select
            showSearch
            size="large"
            style={{ width: '100%' }}
            placeholder="Select an item"
            value={selectedItem || undefined}
            onChange={(value) => handleSelectItem(value)}
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={items.map((item) => ({
              value: item.id,
              label: `${item.itemBrand.brandName} - ${item.itemCode}`,
            }))}
          />
    
       </div>
       <div className="flex w-full flex-col gap-1">
        <label className='mb-1 text-white'>Quantity</label>
       <input
         type="number"
         placeholder="Quantity" 
         onChange={(e) => setQuantity(e.target.value)}
         value={ quantity }
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
        />
   </div>

<div className="flex w-full flex-col gap-1">
    <label className='mb-1 text-white'>Item Unit Price</label>
    <InputNumber
        value={ itemUnitPrice }
        onChange={(value) => setItemUnitPrice(value)}
        formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        placeholder="Item Unit Price" 
        className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
        style={{
            width: "100%", 
            height: 48,
            borderRadius: 12,
            fontFamily: "Poppins, sans-serif",
            fontSize: 16 }}
  // inputStyle removed: not a valid prop for InputNumber
      />
   </div>
       <div className="flex w-full flex-col gap-1">
        <label className='mb-1 text-white'>Total Price</label>
        <InputNumber
        value={ totalPrice }
        placeholder="Total Price" 
        readOnly={true}
        formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
        style={{
            width: "100%", 
            height: 48,
            borderRadius: 12,
            fontFamily: "Poppins, sans-serif",
            fontSize: 16 }}
            // inputStyle removed: not a valid prop for InputNumber
          />
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
</div>

{/* Items Table */}
{grnItems.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold text-white mb-4">Added Items</h2>
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Supplier</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Price</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Invoice No</th>
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
              <td className="px-4 py-3 text-sm text-gray-900">{item.invoiceNumber}</td>
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
            <td colSpan="5" className="px-4 py-3 text-right font-semibold text-gray-900">Grand Total:</td>
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

{/* Edit GRN Modal */}
<Modal
  title="Edit GRN"
  open={isEditModalVisible}
  onCancel={handleEditModalCancel}
  width={1200}
  footer={null}
  className="edit-grn-modal"
>
  <Form
    form={editForm}
    layout="vertical"
    onFinish={handleAddEditItem}
    className="space-y-4"
  >
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Form.Item
        label="GRN Number"
        name="grnNumber"
      >
        <Input disabled />
      </Form.Item>
      
      <Form.Item
        label="Invoice Number"
        name="invoiceNumber"
        rules={[{ required: true, message: 'Please enter invoice number!' }]}
      >
        <Input placeholder="Invoice Number" />
      </Form.Item>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Add/Edit Items</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Form.Item
          label="Select Item"
          name="selectedItem"
          rules={[{ required: true, message: 'Please select an item!' }]}
        >
          <Select
            showSearch
            placeholder="Select an item"
            optionFilterProp="label"
            options={items.map((item) => ({
              value: item.id,
              label: `${item.itemBrand.brandName} - ${item.itemCode}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Supplier Name"
          name="supplierName"
          rules={[{ required: true, message: 'Please enter supplier name!' }]}
        >
          <Input placeholder="Supplier Name" />
        </Form.Item>

        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[{ required: true, message: 'Please enter quantity!' }]}
        >
          <InputNumber
            min={1}
            placeholder="Quantity"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Unit Price"
          name="unitPrice"
          rules={[{ required: true, message: 'Please enter unit price!' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            placeholder="Unit Price"
            style={{ width: '100%' }}
            formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Invoice Number for Item"
          name="invoiceNumber"
          rules={[{ required: true, message: 'Please enter invoice number for this item!' }]}
        >
          <Input placeholder="Invoice Number" />
        </Form.Item>
      </div>

      <Button type="primary" htmlType="submit" className="bg-[#FC890D] hover:bg-[#FD9A2E]">
        Add Item
      </Button>
    </div>

    {/* Edit Items Table */}
    {editGrnItems.length > 0 && (
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-4">Items in GRN</h4>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Supplier</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Invoice No</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {editGrnItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.supplier_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleUpdateEditItem(index)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <EditOutlined />
                      </button>
                      <button
                        onClick={() => handleRemoveEditItem(index)}
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
                <td colSpan="5" className="px-4 py-3 text-right font-semibold text-gray-900">Grand Total:</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{editGrandTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )}

    <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
      <Button onClick={handleEditModalCancel}>
        Cancel
      </Button>
      <Button 
        type="primary" 
        onClick={handleUpdateGRN}
        className="bg-[#FC890D] hover:bg-[#FD9A2E]"
        disabled={editGrnItems.length === 0}
      >
        Update GRN
      </Button>
    </div>
  </Form>
</Modal>

{/* Updated Filter Section with Single Date */}
<div className="mt-12 mb-6">
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Filter Purchase Orders</h3>
    <div className="flex flex-wrap gap-4 items-end">
      {/* Search by GRN Number or Invoice Number */}
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-700">Search by GRN/Invoice Number</label>
        <input
          type="text"
          placeholder="Enter GRN or Invoice Number"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-[300px] h-[33px] text-sm px-3 py-2 rounded shadow border border-gray-300 text-gray-700"
          style={{ fontFamily: 'Poppins' }}
        />
        
        
      </div>

      {/* Single Date Filter */}
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-700">Filter by Date</label>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          style={{ width: 200, height: 33, fontFamily: 'Poppins' }}
          format="YYYY-MM-DD"
          placeholder="Select Date"
          prefix={<CalendarOutlined />}
        />
      </div>

      {/*Search Button*/}
      <button
        onClick={handleSearch}
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
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = '#FD9A2E'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = '#FC890D'}
      >
        Search
      </button>

      {/* Clear Filters Button */}
      <button
        onClick={clearFilters}
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
  <h2 className="text-xl font-bold text-white mb-4">All GRNs</h2>
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

