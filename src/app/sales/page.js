'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, Form, Input, InputNumber, Popconfirm, Typography, Select } from 'antd'
import CreateCustomer from '../components/CreateCustomer'

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
    const [salesNumber, setSalesNumber] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [customers, setCustomers] = useState([])
    const [items, setItems] = useState([])
    const [quantity, setQuantity] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [itemUnitPrice, setItemUnitPrice] = useState('')
    const [totalPrice, setTotalPrice] = useState('')
    const [note, setNote] = useState('')
    const [salesItems, setSalesItems] = useState([])
    const [grandTotal, setGrandTotal] = useState(0)
    const [allSales, setAllSales] = useState([])
    const [editingKey, setEditingKey] = useState('');
    const [showCreateCustomer, setCreateCustomer] = useState(false)

  const getCurrentSalesNumber = async () => {
    try {
       const res = await axios.get(`http://localhost:8080/api/sales-order/last-order-number`)
       const data = res.data
       const year = new Date().getFullYear()
       
       // Check if any data is available
       if (data && data.trim() !== '' && data !== 'null' && data !== 'undefined') {
         // If there's existing data, increment the last number
         try {
           const parts = data.split('-')
           if (parts.length === 3) {
             const lastNumber = parseInt(parts[2])
             if (!isNaN(lastNumber)) {
               const newNumber = lastNumber + 1
               const formattedNumber = `SAL-${year}-${String(newNumber).padStart(3, '0')}`
               setSalesNumber(formattedNumber)
               console.log('Generated next sales number:', formattedNumber)
               return
             }
           }
         } catch (parseError) {
           console.log('Error parsing last number, setting initial number')
         }
       }
       
       // If no data available or parsing failed, set initial sales number
       const initialNumber = `SAL-${year}-001`
       setSalesNumber(initialNumber)
       console.log('Set initial sales number:', initialNumber)
       
    } catch (error) {
        console.log('Error fetching sales number:', error)
        // If API call fails, set initial sales number
        const year = new Date().getFullYear()
        const initialNumber = `SAL-${year}-001`
        setSalesNumber(initialNumber)
        console.log('Set initial sales number due to error:', initialNumber)
    }
  }

  const handleAddCustomer = () => {
    setCreateCustomer(true);
  };

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

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/customer');
      const data = await response.json();
      console.log("customers",data);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerById = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/customer/${customerId}`);
      const data = await response.json();
      return data.customerName;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return `Customer ${customerId}`;
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(customer => customer.id === customerId)
    return customer ? customer.customerName : `Customer ${customerId}`
  }

  const fetchAllSales = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/sales-order');
      const data = await response.json();
      
      // Fetch customer names for all sales
      const salesWithCustomerNames = await Promise.all(
        data.map(async (sale) => {
          const formattedCreatedAt = sale.createdAt.split('T')[0]
          let customerName = getCustomerName(sale.customerId);
          
          // If customer not found in local data, fetch from API
          if (customerName === `Customer ${sale.customerId}`) {
            customerName = await fetchCustomerById(sale.customerId);
          }
          
          return {
            ...sale,
            createdAt: formattedCreatedAt,
            key: sale.id.toString(),
            salesNumber: sale.salesOrderNo,
            customerName: customerName,
            items: sale.items.map((item, index) => ({
              ...item,
              key: `${sale.id}-${item.id || index}`,
              itemName: getItemName(item.itemId) || `Item ${item.itemId}`,
              unitPrice: item.soItemUnitPrice,
              totalPrice: item.soItemTotalAmount,
              totalAmount: item.soItemTotalAmount
            }))
          }
        })
      );
      
      console.log('Sales with customer names:', salesWithCustomerNames)
      setAllSales(salesWithCustomerNames);
      console.log('All Sales:', data)
    } catch (error) {
      console.error('Error fetching Sales:', error);
    }
  };

  useEffect(() => {
    getCurrentSalesNumber()
    fetchItems()
    fetchAllSales()
    fetchCustomers()
  }, [])

  useEffect(() => {
    autoCalculateTotalPrice()
  }, [quantity, itemUnitPrice])

  useEffect(() => {
    calculateGrandTotal()
  }, [salesItems])

  const autoCalculateTotalPrice = () => {
    if (quantity && itemUnitPrice) {
      setTotalPrice(parseFloat(quantity) * parseFloat(itemUnitPrice))
    } else {
      setTotalPrice('')
    }
  }

  const calculateGrandTotal = () => {
    const total = salesItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
    setGrandTotal(total)
  }

  const getItemName = (itemId) => {
    const item = items.find(item => item.id == itemId)
    return item ? `${item.itemBrand.brandName} - ${item.itemCode}` : ''
  }

  const resetForm = () => {
    setCustomerName('')
    setQuantity('')
    setSelectedItem('')
    setItemUnitPrice('')
    setTotalPrice('')
    setNote('')
  }

  const resetAll = () => {
    resetForm()
    setSalesItems([])
    setGrandTotal(0)
    getCurrentSalesNumber()
  }

  const handleAddItem = () => {
    if (!selectedItem || !customerName || !quantity || !itemUnitPrice) {
      customToast('error', 'Please fill all fields')
      return
    }

    const selectedCustomer = customers.find(customer => customer.id === parseInt(customerName))
    
    const newItem = {
      itemId: parseInt(selectedItem),
      itemName: getItemName(selectedItem),
      customer_name: selectedCustomer?.customerName || '',
      quantity: parseInt(quantity),
      unitPrice: parseFloat(itemUnitPrice),
      totalPrice: parseFloat(totalPrice),
      createdAt: new Date().toISOString().slice(0, 19)
    }

    const existingItem = salesItems.find(item => item.itemId === parseInt(selectedItem))
    if (existingItem) {
      customToast('error', 'Item already added')
      return
    }

    // Always add as new item since update removes the original from table
    setSalesItems([...salesItems, newItem])
    customToast('success', 'Item added successfully')

    resetForm()
  }

  const handleRemoveItem = (index) => {
    const updatedItems = salesItems.filter((_, i) => i !== index)
    setSalesItems(updatedItems)
    customToast('success', 'Item removed successfully')
  }

  const handleUpdateItem = (index) => {
    const item = salesItems[index]
    setSelectedItem(item.itemId.toString())
    
    // Find customer by name to set the correct customer ID
    const customer = customers.find(c => c.customerName === item.customer_name)
    setCustomerName(customer ? customer.id.toString() : '')
    
    setQuantity(item.quantity.toString())
    setItemUnitPrice(item.unitPrice.toString())
    setTotalPrice(item.totalPrice.toString())
    
    // Remove the item from the table
    const updatedItems = salesItems.filter((_, i) => i !== index)
    setSalesItems(updatedItems)
  }

  

  const handleCreateSale = async () => {
  if (salesItems.length === 0) {
    customToast('error', 'Please add at least one item')
    return
  }

  // Get the customer ID from the first item (assuming all items have the same customer)
  const firstItem = salesItems[0]
  const selectedCustomer = customers.find(customer => customer.customerName === firstItem.customer_name)
  
  if (!selectedCustomer) {
    customToast('error', 'Customer not found')
    return
  }

  const salesData = {
    salesOrderNo: salesNumber,
    salesOrderType: "RETAIL",
    totalAmount: parseFloat(grandTotal), // Ensure it's a number
    customerId: parseInt(selectedCustomer.id), // Ensure it's a number
    note: note || "",
    createdAt: new Date().toISOString(),
    items: salesItems.map(item => ({
      itemId: parseInt(item.itemId), // Ensure it's a number
      quantity: parseInt(item.quantity), // Ensure it's a number
      soItemUnitPrice: parseFloat(item.unitPrice), // Ensure it's a number
      soItemTotalAmount: parseFloat(item.totalPrice), // Ensure it's a number
      createdAt: new Date().toISOString()
    }))
  }

  console.log('Sales Data being sent:', JSON.stringify(salesData, null, 2)); // Debug log

  try {
    const response = await axios.post('http://localhost:8080/api/sales-order', salesData, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    customToast('success', 'Sale created successfully')
    resetAll()
    fetchAllSales() // Refresh the sales list
  } catch (error) {
    console.error('Sales creation error:', error.response?.data || error.message)
    customToast('error', `Error creating sale: ${error.response?.data?.message || error.message}`)
  }
}



  const handleDeleteSale = async (salesId) => {
    try {
        console.log("delete sale",salesId)
      const response = await axios.delete(`http://localhost:8080/api/sales-order/${salesId}`)
      customToast('success', 'Sale deleted successfully')
      fetchAllSales() // Refresh the sales list
    } catch (error) {
      customToast('error', `Error deleting sale: ${error.message}`)
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    try {
      const response = await axios.delete(`http://localhost:8080/api/customer/${customerId}`)
      customToast('success', 'Customer deleted successfully')
      fetchCustomers() // Refresh the customer list
    } catch (error) {
      customToast('error', `Error deleting customer: ${error.message}`)
    }
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
      title: 'Sales Order No',
      dataIndex: 'salesNumber',
      key: 'salesNumber',
      width: '20%',
    },
    {
      title: 'Order Type',
      dataIndex: 'salesOrderType',
      key: 'salesOrderType',
      width: '15%',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '15%',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '15%',
      render: (amount) => `LKR ${parseFloat(amount || 0).toFixed(2)}`,
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      width: '15%',
    },
    {
      title: 'Items Count',
      key: 'itemsCount',
      width: '10%',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Button 
          type="primary" 
          danger
          icon={<DeleteOutlined />} 
          onClick={() => handleDeleteSale(record.id)}
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
            Sales
        </h1>
          {/* Form Section */}
 
       <div className="space-y-4 gap-5 flex w-full">
        
         <div className="flex w-full flex-col gap-1">
           <label className='mb-1'>Sales Number</label>
             <input
               type="text"
               placeholder="Sales Number"
               disabled
               value={ salesNumber }
               className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
             />
        </div>
        <div className="flex w-full flex-col gap-1">
        <label className='mb-1'>Customer Name</label>
        <div className="flex items-center gap-2 space-x-2">
            <Select
              value={customerName || undefined}
              onChange={(value) => setCustomerName(value)}
              placeholder="Select Customer"
              className='!shadow-md border-0'
              style={{ flex: 1, height: 48, borderRadius: 9, background: '#fff', boxShadow: '0 2px 8px #f0f1f2', fontFamily:'Poppins' }}
              dropdownStyle={{ borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px #f0f1f2', padding: 8 }}
            >
              {customers.length === 0 && (
                <Select.Option disabled key="no-customers">No Customers</Select.Option>
              )}
              {customers.map((customer) => (
                <Select.Option value={customer.id.toString()} key={customer.id} className="custom-ant-option">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily:'Poppins' }}>
                    <span>{customer.customerName}</span>
                    <DeleteOutlined
                      onClick={e => { e.stopPropagation(); handleDeleteCustomer(customer.id) }}
                      style={{ color: 'red', marginLeft: 8 }}
                    />
                  </div>
                </Select.Option>
              ))}
            </Select>
            <button onClick={handleAddCustomer} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-gray-800 transition-colors" >
              +
            </button>
            {showCreateCustomer && (
              <CreateCustomer 
                fetchCustomers={fetchCustomers} 
                setCreateCustomer={setCreateCustomer} 
              />
            )}

          </div>
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

<div className="space-y-4 gap-5 flex w-full">
<div className="flex w-full flex-col gap-1">
    <label className='mb-1'>Note (Optional)</label>
       <textarea
         placeholder="Notes..."
         onChange={(e) => setNote(e.target.value)}
         value={ note }
         rows={2}
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white resize-none"
        />
   </div>
   <div className="flex w-full flex-col gap-1">
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
{salesItems.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold mb-4">Added Items</h2>
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Customer</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Price</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {salesItems.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{item.customer_name}</td>
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
{ salesItems.length > 0 && <div className="flex gap-4 mt-8">
  <button
    type="button"
    onClick={resetAll}
    className="px-6 py-3 bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#968D86] transition-colors"
  >
    Reset
  </button>
  <button
    type="button"
    onClick={handleCreateSale}
    className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#FD9A2E] transition-colors"
  >
    Create Sale
  </button>
</div> }

{/* All Sales Expandable Table */}
<div className="mt-12">
  <h2 className="text-xl font-bold mb-4">All Sales</h2>
  <Table 
    columns={mainColumns}
    dataSource={allSales}
    expandable={{
      expandedRowRender,
      defaultExpandedRowKeys: [],
      columnWidth: "100px",
    }}
    pagination={{ pageSize: 10 }}
    size="large"
    className="text-base"
    bordered
  />
</div>

    </MainLayout>

  )
}

export default page
