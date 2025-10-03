'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, Form, Input, InputNumber, Select, DatePicker, Popconfirm  } from 'antd'
import CreateCustomer from '../components/CreateCustomer'
import quantityCalculator from '../utils/quantityCalculator'

const { Option } = Select

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
          rules={[ { required: true, message: `Please Input ${title}!` } ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

// FIX 1: Capitalize component name
const Page = () => {
    const [form] = Form.useForm();
    const [salesNumber, setSalesNumber] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [customers, setCustomers] = useState([])
    const [items, setItems] = useState([])
    const [quantity, setQuantity] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [itemUnitPrice, setItemUnitPrice] = useState('')
    const [isLoose, setIsLoose] = useState(false)
    const [looseInLiters, setLooseInLiters] = useState('')
    const [looseInMili, setLooseInMili] = useState('')
    const [orderType, setOrderType] = useState('')
    const [totalPrice, setTotalPrice] = useState('')
    const [note, setNote] = useState('')
    const [salesItems, setSalesItems] = useState([])
    const [grandTotal, setGrandTotal] = useState(0)
    const [allSales, setAllSales] = useState([])
    const [salesLoading, setSalesLoading] = useState(false)
    const [salesPage, setSalesPage] = useState(1)
    const [salesPageSize, setSalesPageSize] = useState(10)
    const [salesTotal, setSalesTotal] = useState(0)
    const [searchOrderType, setSearchOrderType] = useState('')
    const [searchOrderNo, setSearchOrderNo] = useState('')
    const [searchCreatedAt, setSearchCreatedAt] = useState(null)
    const [editingKey, setEditingKey] = useState('');
    const [showCreateCustomer, setCreateCustomer] = useState(false)
    const [fixedOrderData, setFixedOrderData] = useState(false)
    const [mounted, setMounted] = useState(false);
    const [reportStartDate, setReportStartDate] = useState(null);
    const [reportEndDate, setReportEndDate] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [totalExpenses, setTotalExpenses] = useState(false);
    const [customerCache, setCustomerCache] = useState({});

  const getCurrentSalesNumber = async () => {
    try {
       const res = await axios.get(`http://localhost:8080/api/sales-order/last-order-number`)
       const data = res.data
       const year = new Date().getFullYear()
       
       if (data && data.trim() !== '' && data !== 'null' && data !== 'undefined') {
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
       
       const initialNumber = `SAL-${year}-001`
       setSalesNumber(initialNumber)
       console.log('Set initial sales number:', initialNumber)
       
    } catch (error) {
        console.log('Error fetching sales number:', error)
        const year = new Date().getFullYear()
        const initialNumber = `SAL-${year}-001`
        setSalesNumber(initialNumber)
        console.log('Set initial sales number due to error:', initialNumber)
    }
  }

  const handleAddCustomer = () => {
    setCreateCustomer(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const convertLitresToMilliliters = (liters) => {
    return liters * 1000;
  };

  // FIX 2: Auto-calculate milliliters from liters when loose
  useEffect(() => {
    if (isLoose && looseInLiters) {
      const mili = convertLitresToMilliliters(parseFloat(looseInLiters));
      setLooseInMili(mili.toString());
    } else if (!isLoose) {
      setLooseInMili('');
    }
  }, [isLoose, looseInLiters]);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/item');
      const data = await response.json();
      console.log("items",data);
      setItems(data);
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
    if (!customerId) return null;

    if (customerCache[customerId]) {
      return customerCache[customerId];
    }

    setCustomerCache(prev => ({ ...prev, [customerId]: "loading..." }));

    try {
      const response = await fetch(`http://localhost:8080/api/customer/${customerId}`);
      const data = await response.json();
      const name = data.customerName || `Customer ${customerId}`;

      setCustomerCache(prev => ({ ...prev, [customerId]: name }));
      return name;
    } catch (error) {
      console.error('Error fetching customer:', error);
      setCustomerCache(prev => ({ ...prev, [customerId]: `Customer ${customerId}` }));
      return `Customer ${customerId}`;
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(customer => customer.id === customerId)
    return customer ? customer.customerName : `Customer ${customerId}`
  }

  const fetchAllSales = async () => {
    try {
      setSalesLoading(true);
      const response = await fetch('http://localhost:8080/api/sales-order');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw sales data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', typeof data, data);
        setAllSales([]);
        setSalesTotal(0);
        return;
      }
      
      const salesWithCustomerNames = await Promise.all(
        data.map(async (sale) => {
          try {
            const formattedCreatedAt = sale.createdAt ? sale.createdAt.split('T')[0] : 'Unknown';
            let customerName = getCustomerName(sale.customerId);
            
            if (customerName === `Customer ${sale.customerId}`) {
              customerName = await fetchCustomerById(sale.customerId);
            }
            
            return {
              ...sale,
              createdAt: formattedCreatedAt,
              key: sale.id ? sale.id.toString() : `unknown-${Math.random()}`,
              salesNumber: sale.salesOrderNo || 'Unknown',
              customerName: customerName,
              items: (sale.items || []).map((item, index) => ({
                ...item,
                key: `${sale.id}-${item.id || index}`,
                itemName: getItemName(item.itemId) || `Item ${item.itemId}`,
                unitPrice: item.soItemUnitPrice || 0,
                totalPrice: item.soItemTotalAmount || 0,
                totalAmount: item.soItemTotalAmount || 0
              }))
            };
          } catch (error) {
            console.error('Error processing sale:', sale, error);
            return {
              ...sale,
              createdAt: sale.createdAt?.split('T')[0] || 'Unknown',
              key: sale.id?.toString() || `unknown-${Math.random()}`,
              salesNumber: sale.salesOrderNo || 'Unknown',
              customerName: 'Error loading',
              items: []
            };
          }
        })
      );
      
      console.log('Processed sales with customer names:', salesWithCustomerNames);
      setAllSales(salesWithCustomerNames);
      setSalesTotal(salesWithCustomerNames.length);
      
    } catch (error) {
      console.error('Error fetching Sales:', error);
      customToast('error', `Failed to fetch sales: ${error.message}`);
      setAllSales([]);
      setSalesTotal(0);
    } finally {
      setSalesLoading(false);
    }
  };

  const openPdfInNewTab = (pdfBase64) => {
    try {
      const clean = (pdfBase64 || '').includes(',')
        ? pdfBase64.split(',').pop()
        : pdfBase64;

      const byteChars = atob(clean);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank', 'noopener,noreferrer');

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error('PDF open error:', err);
      customToast('error', 'Could not open the PDF.');
    }
  };

  const generateSalesReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      customToast('error', 'Please select both From Date and To Date.');
      return;
    }

    const startDate = reportStartDate.format('YYYY-MM-DD');
    const endDate = reportEndDate.format('YYYY-MM-DD');
    const expenses = totalExpenses ? totalExpenses : 0

    setReportLoading(true);
    try {
      const url = `http://localhost:8080/api/reports/sales-orders`;
      const res = await axios.get(url, {
        params: { startDate, endDate, expenses },
      });

      const pdfBase64 = res?.data?.pdfBase64;
      if (!pdfBase64) {
        customToast('error', 'Report response did not include pdfBase64.');
        return;
      }

      openPdfInNewTab(pdfBase64);
      customToast('success', 'Report generated.');
    } catch (error) {
      console.error('Report error:', error);
      customToast('error', error?.response?.data?.message || 'Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    getCurrentSalesNumber();
    fetchItems();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAllSales();
    }
  }, [mounted, salesPage, salesPageSize, searchOrderType, searchOrderNo, searchCreatedAt]);

  useEffect(() => {
    autoCalculateTotalPrice()
  }, [quantity, itemUnitPrice, isLoose, looseInLiters])

  useEffect(() => {
    calculateGrandTotal()
  }, [salesItems])

  const autoCalculateTotalPrice = () => {
    if (isLoose && looseInLiters && itemUnitPrice) {
      // For loose items, calculate based on liters
      setTotalPrice(parseFloat(looseInLiters) * parseFloat(itemUnitPrice))
    } 
    else if (!isLoose && quantity && itemUnitPrice) {
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

  const resetForAddItem = () => {
    setQuantity('')
    setSelectedItem('')
    setItemUnitPrice('')
    setTotalPrice('')
    setNote('')
    setIsLoose(false)
    setLooseInLiters('')
    setLooseInMili('')
  }

  const resetForm = () => {
    setQuantity('')
    setSelectedItem('')
    setItemUnitPrice('')
    setTotalPrice('')
    setNote('')
    setIsLoose(false)
    setLooseInLiters('')
    setLooseInMili('')
    setOrderType('')
    setCustomerName('')
  }

  const resetAll = () => {
    resetForm()
    setFixedOrderData(false)
    setSalesItems([])
    setGrandTotal(0)
    getCurrentSalesNumber()
  }

  const handleSelectItem = (value) => {
    console.log(value);
    setSelectedItem(value)
  }

  // FIX 3: Corrected handleAddItem function
  const handleAddItem = () => {
    if (!selectedItem || !itemUnitPrice) {
      customToast('error', 'Please fill all fields')
      return
    }
      
    setFixedOrderData(true)

    if (isLoose) {
      if (!looseInLiters || isNaN(looseInLiters) || looseInLiters <= 0) {
        customToast('error', 'Please enter amount in Litres')
        return
      }
    } else {
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        customToast('error', 'Please enter quantity')
        return
      }
    }

    let selectedCustomer = null;
    if (customerName) { 
      selectedCustomer = customers.find(customer => customer.id === parseInt(customerName)) 
    }

    // Calculate quantities based on whether it's loose or not
    let quantityMilliliters = null;
    let quantityLiters = null;

    if (isLoose) {
      // For loose items, use the entered liters value
      quantityLiters = parseFloat(looseInLiters);
      quantityMilliliters = parseInt(looseInMili);
    } else {
      // For non-loose items, calculate from quantityCalculator
      const response = quantityCalculator(quantity, getItemName(selectedItem));
      quantityMilliliters = response?.quantityInMili || 0;
      quantityLiters = quantityMilliliters / 1000;
    }

    const newItem = {
      itemId: parseInt(selectedItem),
      itemName: getItemName(selectedItem),
      customer_name: selectedCustomer?.customerName || '',
      isLoose: Boolean(isLoose),
      quantity: isLoose ? null : parseInt(quantity),
      quantityMilliliters: quantityMilliliters,
      quantityLiters: quantityLiters,
      unitPrice: parseFloat(itemUnitPrice),
      totalPrice: parseFloat(totalPrice),
      createdAt: new Date().toISOString().slice(0, 19)
    };

    const existingItem = salesItems.find(item => item.itemId === parseInt(selectedItem))
    if (existingItem) {
      customToast('error', 'Item already added')
      return
    }

    setSalesItems([...salesItems, newItem])
    customToast('success', 'Item added successfully')
    resetForAddItem()
  }

  const handleRemoveItem = (index) => {
    const updatedItems = salesItems.filter((_, i) => i !== index)
    setSalesItems(updatedItems)
    customToast('success', 'Item removed successfully')
  }

  const handleUpdateItem = (index) => {
    const item = salesItems[index]
    
    setSelectedItem(item.itemId.toString())
   
    const customer = customers.find(c => c.customerName === item.customer_name)
    setCustomerName(customer ? customer.id.toString() : '')
    setLooseInLiters(item?.quantityLiters?.toString() || '')
    setLooseInMili(item?.quantityMilliliters?.toString() || '')
    setIsLoose(Boolean(item?.isLoose))
    setQuantity(item?.quantity?.toString() || '')
    setItemUnitPrice(item.unitPrice.toString())
    setTotalPrice(item.totalPrice.toString())
    
    const updatedItems = salesItems.filter((_, i) => i !== index)
    setSalesItems(updatedItems)
  }

  const handleCreateSale = async () => {
    if (salesItems.length === 0) {
      customToast('error', 'Please add at least one item')
      return
    }

    const firstItem = salesItems[0]
    const selectedCustomer = customers.find(customer => customer.customerName === firstItem.customer_name)

    const salesData = {
      salesOrderNo: salesNumber,
      salesOrderType: orderType,
      totalAmount: parseFloat(grandTotal),
      customerId: parseInt(selectedCustomer?.id || null),
      note: note || "",
      createdAt: new Date().toISOString(),
      items: salesItems.map(item => ({
        itemId: parseInt(item.itemId),
        quantity: item.quantity ? parseInt(item.quantity) : null,
        quantityLiters: item.quantityLiters ? parseFloat(item.quantityLiters) : null,
        isLoose: Boolean(item.isLoose),
        quantityMilliliters: item.quantityMilliliters ? parseInt(item.quantityMilliliters) : null,
        soItemUnitPrice: parseFloat(item.unitPrice),
        soItemTotalAmount: parseFloat(item.totalPrice),
        createdAt: new Date().toISOString()
      }))
    }

    console.log('Sales Data being sent:', JSON.stringify(salesData, null, 2));

    try {
      const response = await axios.post('http://localhost:8080/api/sales-order', salesData, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      customToast('success', 'Sale created successfully')
      resetAll()
      fetchAllSales()
    } catch (error) {
      console.error('Sales creation error:', error.response?.data || error.message)
      customToast('error', `Error creating sale: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleDeleteSale = async (salesId) => {
    try {
      console.log("delete sale", salesId)
      const response = await axios.delete(`http://localhost:8080/api/sales-order/${salesId}`)
      customToast('success', 'Sale deleted successfully')
      fetchAllSales()
    } catch (error) {
      customToast('error', `Error deleting sale: ${error.message}`)
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    try {
      const response = await axios.delete(`http://localhost:8080/api/customer/${customerId}`)
      customToast('success', 'Customer deleted successfully')
      fetchCustomers()
    } catch (error) {
      customToast('error', `Error deleting customer: ${error.message}`)
    }
  }

  const isEditing = (record) => record.key === editingKey;

  const nestedColumns = [
    {
      title: 'Item Code',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (code) => {
        const itemSelected = items.find((item) => item.id === code);
        return itemSelected ? itemSelected.itemCode : `Item ${code}`;
      },
      editable: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity) => quantity ? quantity : 'N/A',
      editable: true,
    },
    {
      title: 'Quantity (Liters)',
      dataIndex: 'quantityMilliliters',
      key: 'quantityLiters',
      render: (quantityML) => {
        if (!quantityML) return 'N/A';
        const liters = quantityML / 1000;
        return liters.toFixed(3);
      },
      editable: true,
    },
    {
      title: 'Is Loose',
      dataIndex: 'isLoose',
      key: 'isLoose',
      render: (value) => value === true ? 'Yes' : 'No',
      editable: true,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price) => 
        parseFloat(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      editable: true,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount, record) => 
        parseFloat(amount || record.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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

  const mainColumns = [
    {
      title: 'Sales Order No',
      dataIndex: 'salesNumber',
      key: 'salesNumber',
      width: '16%',
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
      render: (amount) => {
        const value = parseFloat(amount || 0);
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },    
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => {
        if (record.salesOrderType === "CASH") {
          return <span>-</span>;
        }
        if (text === "loading...") {
          return <span style={{ color: "#999" }}>Fetching...</span>;
        }
        return <span>{text}</span>;
      },
    },
    {
      title: 'Count',
      key: 'itemsCount',
      width: '10%',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Popconfirm
          title="Delete Sale"
          description="Are you sure to delete this sales order?"
          onConfirm={() => handleDeleteSale(record.id)}
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
          />
        </Popconfirm>
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
        className="nested-table" 
        rowClassName="editable-row"
      />
    </Form>
  );

  return (
     <MainLayout>
         <h1  className="text-2xl font-bold mb-6 w-full py-4 px-6" 
          style={{  background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)',  color: '#515151' }}
         >
            Sales Order
        </h1>
          
       { mounted && <div className='flex gap-5'>
        <div className='flex flex-col w-[60%] bg-[#3D3B3B] gap-2 px-8 py-8 rounded-lg'>
         <div className="flex w-full flex-col gap-1">
           <label className='mb-1 text-white'>Sales Number</label>
             <input
               type="text"
               placeholder="Sales Number"
               disabled
               value={ salesNumber }
               className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
             />
        </div>
         <div className='flex flex-col h-[80px] gap-1'>
      <label className="mb-1 block text-white">Select Order Type</label>
      <Select
        placeholder="Choose Order Type"
        disabled={fixedOrderData}
        style={{ flex: 1, height: 48, borderRadius: 9, background: '#fff', fontFamily:'Poppins', width:'100%' }}
        dropdownStyle={{ borderRadius: 8, background: '#fff', padding: 8 }}
        value={orderType || undefined} 
        onChange={(value) => setOrderType(value)}
      >
        <Option value="CASH">CASH</Option>
        <Option value="CREDIT">CREDIT</Option>
      </Select>
    </div>
      { orderType !== 'CASH' && <div className="flex w-full flex-col h-[80px] gap-1">
        <label className='mb-1 text-white'>Credit Customer</label>
        <div className="flex items-center gap-2 space-x-2">
            <Select
              value={customerName || undefined}
              disabled={fixedOrderData}
              onChange={(value) => setCustomerName(value)}
              placeholder="Select Customer"
              className='!shadow-md border-0'
              style={{ flex: 1, height: 48, borderRadius: 9, background: '#fff', fontFamily:'Poppins'}}
              dropdownStyle={{ borderRadius: 8, background: '#fff', padding: 8 }}
            >
              {customers.length === 0 && (
                <Select.Option disabled key="no-customers">No Customers</Select.Option>
              )}
              {customers.map((customer) => (
                <Select.Option value={customer.id.toString()} key={customer.id} className="custom-ant-option">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily:'Poppins' }}>
                    <span>{customer.customerCode.toUpperCase()}</span>
                    <DeleteOutlined
                      onClick={e => { e.stopPropagation(); handleDeleteCustomer(customer.id) }}
                      style={{ color: 'red', marginLeft: 8 }}
                    />
                  </div>
                </Select.Option>
              ))}
            </Select>
            <button onClick={handleAddCustomer} className="w-8 h-8 bg-black cursor-pointer text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-[#6B6B6B] transition-colors" >
              +
            </button>
            {showCreateCustomer && (
              <CreateCustomer 
                fetchCustomers={fetchCustomers} 
                setCreateCustomer={setCreateCustomer} 
              />
            )}
          </div>
    </div>}

        <div className="flex w-full h-[80px] flex-col gap-1">
          <label className='mb-1 text-white'>Select Item</label>
           <Select
               showSearch
                size="large"
              style={{ flex: 1, height: 48, borderRadius: 9, background: '#fff', fontFamily:'Poppins' }}
               placeholder="Select an item"
               dropdownStyle={{ borderRadius: 8, background: '#fff', padding: 8 }}
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
    <div className="flex items-center gap-2 py-4">
        <input
          type="checkbox"
          checked={isLoose}
          onChange={(e) => setIsLoose(e.target.checked)}
          className="h-5 w-5 cursor-pointer"
        />
        <label className="text-white cursor-pointer">Is Loose</label>
      </div>
       { !isLoose && (
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
       )}

       { isLoose && (
        <div className="flex w-full flex-col gap-1">
        <label className='mb-1 text-white'>Quantity In Litres</label>
         <InputNumber
                value={ looseInLiters }
                onChange={(value) => setLooseInLiters(value)}
                formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="Litres" 
                className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
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
              />
      </div>
       )}

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
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 16 }}
                    inputStyle={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 16,
                   }}
              />
   </div>
       <div className="flex w-full flex-col gap-1">
        <label className='mb-1 text-white'>Total Price</label>
               <InputNumber
                value={ totalPrice }
                formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                readOnly
                placeholder="Total Price"  
                className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
                style={{
                    width: "100%", 
                    height: 48,
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 16 }}
                    inputStyle={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 16,
                   }}
              />
   </div>

<div className="flex w-full flex-col gap-1">
    <label className='mb-1 text-white'>Note (Optional)</label>
       <textarea
         placeholder="Notes..."
         onChange={(e) => setNote(e.target.value)}
         value={ note }
         rows={2}
         className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white resize-none"
        />
   </div>

<div className="flex gap-4 mt-6">
  <button
    type="button"
    onClick={ resetForAddItem }
    className="px-6 py-3 bg-[#6B6B6B] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors cursor-pointer"
  >
    Cancel
  </button>
  <button
    type="button"
    onClick={handleAddItem}
    className="px-6 py-3 bg-[#FC890D] cursor-pointer text-white rounded-lg shadow-md hover:bg-[#FD9A2E] transition-colors"
  >
    Add Item
  </button>
</div>
 
</div>
<div className="h-[10%] w-[40%] flex flex-col gap-5 bg-white/5 px-8 py-8 rounded-lg">
  <div className="flex w-full gap-3">
    <div className="flex flex-col w-full">
      <label className="mb-1 text-white">From Date</label>
      <DatePicker
        value={reportStartDate}
        onChange={(d) => setReportStartDate(d)}
        format="YYYY-MM-DD"
        style={{ height: 48,  fontFamily: "Poppins, sans-serif", }}
        inputReadOnly
      />
    </div>

    <div className="flex flex-col w-full">
      <label className="mb-1 text-white">To Date</label>
      <DatePicker
        value={reportEndDate}
        onChange={(d) => setReportEndDate(d)}
        format="YYYY-MM-DD"
        style={{ height: 48,  fontFamily: "Poppins, sans-serif", }}
        inputReadOnly
      />
    </div>

  </div>
  
      <div className="flex w-full flex-col gap-1">
        <label className='mb-1 text-white'>Total Optional Expenses</label>
               <InputNumber
                value={ totalExpenses }
                formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                onChange={(e)=>setTotalExpenses(e)}
                placeholder="Total Optional Expenses"  
                className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
                style={{
                    width: "100%", 
                    height: 48,
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 16 }}
                    inputStyle={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 16,
                   }}
         />
   </div>
   <div className="flex gap-2 ml-auto">
      <Button
        type="primary"
        onClick={generateSalesReport}
        loading={reportLoading}
        disabled={!reportStartDate || !reportEndDate}
        className="bg-[#0d5dfc] !border-none hover:bg-[#376cff]  disabled:!bg-[#538fff] disabled:!text-[#f8f8f8] disabled:!cursor-not-allowed"
        style={{ height: 48,  fontFamily: "Poppins, sans-serif", }}
      >
        Generate Sales Report
      </Button>
    </div>
</div>

 </div>
 }

{salesItems.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold mb-4 text-white">Added Items</h2>
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Customer</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity (Liters)</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Price</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {salesItems.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {orderType === 'CASH' ? 'CASH' : (item.customer_name || '-')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-center">
                {item.quantity || 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-center">
                {item.quantityLiters ? (item.quantityLiters).toFixed(3) : 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
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
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)}

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

{ mounted && (
  <div className="mt-12 mb-6">
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Filter Sales Orders</h3>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Search by Order No</label>
          <Input.Search
            placeholder="Enter Order No"
            value={searchOrderNo}
            onChange={e => setSearchOrderNo(e.target.value)}
            onSearch={() => { setSalesPage(1); fetchAllSales({ page: 1 }); }}
            style={{ width: 220 }}
            allowClear
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Order Type</label>
          <Select
            placeholder="Select Type"
            value={searchOrderType || undefined}
            onChange={v => { setSearchOrderType(v); setSalesPage(1); }}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="CASH">CASH</Option>
            <Option value="CREDIT">CREDIT</Option>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">Created At</label>
          <DatePicker
            value={searchCreatedAt}
            onChange={date => { setSearchCreatedAt(date); setSalesPage(1); }}
            format="YYYY-MM-DD"
            style={{ width: 180 }}
            allowClear
          />
        </div>
        <Button onClick={() => { setSearchOrderNo(''); setSearchOrderType(''); setSearchCreatedAt(''); setSalesPage(1); }} style={{ height: 32 }}>
          Clear
        </Button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        {(searchOrderNo || searchOrderType || searchCreatedAt) ? (
          <p>
            Showing {allSales.length} result{allSales.length !== 1 ? 's' : ''}
            {searchOrderNo && <> for Order No "{searchOrderNo}"</>}
            {searchOrderType && <> of type "{searchOrderType}"</>}
            {searchCreatedAt && <> created at "{searchCreatedAt ? searchCreatedAt.format('YYYY-MM-DD') : ''}"</>}
          </p>
        ) : (
          <p>Showing all {salesTotal} sales orders</p>
        )}
      </div>
    </div>
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">All Sales</h2>
      <Table 
        columns={mainColumns}
        dataSource={allSales}
        loading={salesLoading}
        expandable={{
          expandedRowRender,
          defaultExpandedRowKeys: [],
          columnWidth: "100px",
        }}
        pagination={{
          current: salesPage,
          pageSize: salesPageSize,
          total: salesTotal,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setSalesPage(page);
            setSalesPageSize(pageSize);
          },
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
        size="large"
        className="text-base"
        bordered
        rowKey="key"
      />
    </div>
  </div>
) }

    </MainLayout>

  )
}

export default Page