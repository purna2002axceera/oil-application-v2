

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Popconfirm, Input, Form, Modal, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, UnorderedListOutlined, CheckCircleOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';
import CreateCustomer from '../components/CreateCustomer';
import MainLayout from '../layouts/MainLayout';
import { customToast } from '../utils/toast';

export default function CreditCustomer() {
  // Existing state variables
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showCreateCustomer, setCreateCustomer] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Additional state for credit orders modal
  const [showCreditOrdersModal, setShowCreditOrdersModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditOrders, setCreditOrders] = useState([]);
  const [creditOrdersLoading, setCreditOrdersLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // New state for credit orders search
  const [creditOrderSearchText, setCreditOrderSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Existing fetch customers function
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching customers...');
      const response = await fetch('http://localhost:8080/api/customer', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Customers response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Customers response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch customers'}`);
      }
      
      const data = await response.json();
      console.log('Fetched customers:', data);
      
      setCustomers(Array.isArray(data) ? [...data] : []);
      setFilteredCustomers(Array.isArray(data) ? [...data] : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      customToast('error', `Failed to fetch customers: ${error.message}`);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Updated function to fetch credit orders with search
  const fetchCreditOrders = useCallback(async (customerId, searchText = '') => {
    try {
      setCreditOrdersLoading(true);
      setIsSearching(!!searchText);
      console.log('Fetching credit orders for customer:', customerId, 'with search:', searchText);
      
      let url = `http://localhost:8080/api/customer/credit-orders/${customerId}`;
      if (searchText && searchText.trim()) {
        url += `?searchText=${encodeURIComponent(searchText.trim())}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Credit orders response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch credit orders'}`);
      }
      
      const data = await response.json();
      console.log('Fetched credit orders:', data);
      
      setCreditOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching credit orders:', error);
      customToast('error', `Failed to fetch credit orders: ${error.message}`);
      setCreditOrders([]);
    } finally {
      setCreditOrdersLoading(false);
      setIsSearching(false);
    }
  }, []);

  // Handle credit orders search
  const handleCreditOrderSearch = useCallback(() => {
    if (selectedCustomer) {
      fetchCreditOrders(selectedCustomer.id, creditOrderSearchText);
    }
  }, [selectedCustomer, creditOrderSearchText, fetchCreditOrders]);

  // Handle search input change with debouncing
  useEffect(() => {
    if (!selectedCustomer) return;
    
    const timeoutId = setTimeout(() => {
      fetchCreditOrders(selectedCustomer.id, creditOrderSearchText);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [creditOrderSearchText, selectedCustomer, fetchCreditOrders]);

  // Clear credit orders search
  const handleClearCreditOrderSearch = () => {
    setCreditOrderSearchText('');
    if (selectedCustomer) {
      fetchCreditOrders(selectedCustomer.id, '');
    }
  };

  // Toggle payment status handler
  const handlePaymentStatusUpdate = async (salesOrderId, currentStatus) => {
    try {
      setPaymentLoading(true);
      const newStatus = !currentStatus;
      const response = await axios.put(
        `http://localhost:8080/api/sales-order/credit-payment-status/${salesOrderId}`,
        { status: newStatus }
      );
      customToast('success', `Payment status marked as ${newStatus ? 'PAID' : 'PENDING'}`);
      if (selectedCustomer) {
        fetchCreditOrders(selectedCustomer.id, creditOrderSearchText);
      }
    } catch (error) {
      customToast('error', `Error updating payment status: ${error.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  
  useEffect(() => {
        setMounted(true);
      }, []);

  useEffect(() => {
    console.log('Component mounted, fetching customers...');
    fetchCustomers();
  }, [fetchCustomers]);

  // Existing search functionality
  useEffect(() => {
    if (!searchText) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.customerCode.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.customerPhone.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchText, customers]);

  const handleEdit = (record) => {
    setIsUpdateMode(true);
    setEditingCustomer(record);
    form.setFieldsValue({
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      customerCode: record.customerCode
    });
  };

  // Updated function to handle showing credit orders
  const handleShowCreditOrders = (customer) => {
    setSelectedCustomer(customer);
    setShowCreditOrdersModal(true);
    setCreditOrderSearchText(''); // Reset search text
    fetchCreditOrders(customer.id, ''); // Fetch all orders initially
  };

  const handleDelete = async (data) => {
    try {
      setLoading(true);
      console.log('Deleting customer:', data.id);
      
      const res = await axios.delete(`http://localhost:8080/api/customer/${data.id}`);
      console.log('Delete response:', res.data);
      
      if (!res.data || !res.data.id) {
        customToast('error', "Error When Deleting Customer");
        return;
      }
      
      customToast('success', "Customer Deleted Successfully");
      fetchCustomers(); // Refresh the customer list
      
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.data?.message?.includes("associated")) {
        customToast('error', `This customer has associated sales orders`);
      } else {
        customToast('error', `Error When Deleting: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (values) => {
    try {
      setLoading(true);
      console.log('Updating customer:', values);
      
      const response = await axios.put('http://localhost:8080/api/customer', {
        id: editingCustomer.id,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
      });
      
      console.log('Update response:', response.data);
      customToast('success', "Customer Updated Successfully");
      handleReset();
      fetchCustomers(); // Refresh the customer list
      
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.data?.message?.includes("already exists")) {
        customToast('error', "Customer already exists with this code or phone");
      } else {
        customToast('error', `Something Went Wrong: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setIsUpdateMode(false);
    setEditingCustomer(null);
  };

  const handleAddCustomer = () => setCreateCustomer(true);

  // Updated columns with new Credit Orders action
  const columns = [
    { 
      title: 'Customer Code', 
      dataIndex: 'customerCode', 
      key: 'customerCode',
      width: 150,
      sorter: (a, b) => a.customerCode.localeCompare(b.customerCode),
    },
    { 
      title: 'Customer Name', 
      dataIndex: 'customerName', 
      key: 'customerName',
      width: 200,
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    { 
      title: 'Phone Number', 
      dataIndex: 'customerPhone', 
      key: 'customerPhone',
      width: 150,
    },
    { 
      title: 'Created Date', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Action', 
      key: 'action', 
      width: 180,
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
          <Button 
            style={{ 
              backgroundColor: '#52c41a', 
              borderColor: '#52c41a', 
              color: 'white',
              marginRight: 8, 
              borderRadius: 50, 
              padding: 15 
            }}
            icon={<UnorderedListOutlined />} 
            onClick={() => handleShowCreditOrders(record)} 
            size="small" 
            title="Customer Credit Orders"
          />
          <Popconfirm
            title="Delete Customer"
            description="Are you sure to delete this customer?"
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

  // Credit orders table columns
  const creditOrdersColumns = [
    {
      title: 'Sales Order No',
      dataIndex: 'salesOrderNo',
      key: 'salesOrderNo',
      width: 150,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount) => `Rs. ${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === true ? 'green' : 'orange'}>
          {status === true ? 'PAID' : 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      render: (note) => note || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title={record.status ? "Mark as Pending" : "Mark as Paid"}
          description={
            record.status
              ? "Are you sure you want to mark this order as pending?"
              : "Are you sure you want to mark this order as paid?"
          }
          onConfirm={() => handlePaymentStatusUpdate(record.id, record.status)}
          okText="Confirm"
          cancelText="Cancel"
          okButtonProps={{ className: "custom-popconfirm-btn-ok" }}
          cancelButtonProps={{ className: "custom-popconfirm-btn-cancel" }}
          disabled={paymentLoading}
        >
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="small"
            loading={paymentLoading}
            style={{
              backgroundColor: record.status === true ? '#d9d9d9' : '#1890ff',
              borderColor: record.status === true ? '#d9d9d9' : '#1890ff',
              borderRadius: 50,
              padding: 15
            }}
            title={record.status ? 'Mark as Pending' : 'Mark as Paid'}
          />
        </Popconfirm>
      ),
    },
  ];

  const handleCustomerCreated = useCallback(async () => {
    await fetchCustomers();
    setCreateCustomer(false);
  }, [fetchCustomers]);

  // Function to determine what message to show when no data
  const getNoDataMessage = () => {
    if (isSearching || creditOrdersLoading) {
      return "Searching...";
    }
    if (creditOrderSearchText.trim()) {
      return `No credit orders found matching "${creditOrderSearchText}"`;
    }
    return "No credit orders found for this customer";
  };

  return (
    <MainLayout>
      <div style={{ fontFamily: 'Poppins' }}>
      {/* Header */}
      <h1
        className="text-2xl font-bold mb-6 w-full py-4 px-6"
        style={{
          background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)',
          color: '#515151'
        }}
      >
        Credit Customer Management
      </h1>

      {/* Search and Add Customer Section */}
     { mounted && <div className="flex justify-between items-center mb-6">

        <Button
          type="primary"
          onClick={handleAddCustomer}
          size="large"
          style={{
            backgroundColor: '#FC890D',
            borderColor: '#FC890D',
            borderRadius: 8,
            height: 48,
            fontSize: 16,
            fontFamily: 'Poppins'
          }}
        >
          Add New Customer
        </Button>
      </div> }

      {/* Update Form Section */}
      {isUpdateMode && (
        <div className="mb-8">
          <div className="space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins' }}>Update Customer</h2>
            <Form
              form={form}
              onFinish={handleUpdateCustomer}
              layout="vertical"
            >
              <div className="flex flex-col">
                <div className='flex flex-col w-full'>
                  <label className='mb-1 text-white' style={{ fontFamily: 'Poppins', fontSize: 16  }}>Customer Code</label>
                  <Form.Item
                    name="customerCode"
                    rules={[{ required: true, message: 'Customer code is required' }]}
                  >
                    <Input
                      placeholder="Customer Code"
                      readOnly={ true }
                      className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
                      style={{ height: 48, fontFamily: 'Poppins' }}
                    />
                  </Form.Item>
                </div>

                <div className='flex flex-col w-full'>
                  <label className='mb-1 text-white' style={{ fontFamily: 'Poppins', fontSize: 16  }}>Customer Name</label>
                  <Form.Item
                    name="customerName"
                    rules={[{ required: true, message: 'Customer name is required' }]}
                  >
                    <Input
                      placeholder="Customer Name"
                      className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
                      style={{ height: 48, fontFamily: 'Poppins' }}
                    />
                  </Form.Item>
                </div>

                <div className='flex flex-col w-full'>
                  <label className='mb-1 text-white' style={{ fontFamily: 'Poppins',  fontSize: 16  }}>Phone Number</label>
                  <Form.Item
                    name="customerPhone"
                    rules={[{ required: true, message: 'Phone number is required' }]}
                  >
                    <Input
                      placeholder="Phone Number"
                      className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-white"
                      style={{ height: 48, fontFamily: 'Poppins' }}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    backgroundColor: '#FC890D',
                    borderColor: '#FC890D',
                    width: 200,
                    height: 48,
                    fontSize: 16 ,
                    fontFamily: 'Poppins'
                  }}
                >
                  Update Customer
                </Button>
                <Button
                  onClick={handleReset}
                  style={{
                    backgroundColor: '#6B6B6B',
                    borderColor: '#6B6B6B',
                    color: 'white',
                    width: 120,
                    height: 48,
                      fontSize: 16 ,
                    fontFamily: 'Poppins'
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="mt-8">
        <h2 className="text-xl text-white font-bold mb-4" style={{ fontFamily: 'Poppins' }}>
          Customers List ({filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'})
        </h2>
       { mounted && <Table
          dataSource={filteredCustomers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
          }}
          size="large"
          className="text-base "
          scroll={{ x: 900 }}
          style={{ fontFamily: 'Poppins' }}
        /> }
      </div> 

      {/* Credit Orders Modal */}
      <Modal
        title={
          <div className="text-lg font-bold" style={{ fontFamily: 'Poppins' }}>
            Credit Orders - {selectedCustomer?.customerName} ({selectedCustomer?.customerCode})
          </div>
        }
        open={showCreditOrdersModal}
        onCancel={() => {
          setShowCreditOrdersModal(false);
          setSelectedCustomer(null);
          setCreditOrders([]);
          setCreditOrderSearchText('');
        }}
        footer={null}
        width={1200}
        className="credit-orders-modal"
        style={{ fontFamily: 'Poppins' }}
      >
        <div className="mt-4">
          {/* Search Bar for Credit Orders */}
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search by Order No, Date, or Amount..."
              value={creditOrderSearchText}
              onChange={(e) => setCreditOrderSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{
                height: 40,
                fontSize: 14,
                fontFamily: 'Poppins',
                flex: 1
              }}
              // disabled={creditOrdersLoading}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleCreditOrderSearch}
              loading={creditOrdersLoading}
              style={{
                height: 40,
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                fontFamily: 'Poppins'
              }}
            >
              Search
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearCreditOrderSearch}
              disabled={creditOrdersLoading || !creditOrderSearchText}
              style={{
                height: 40,
                fontFamily: 'Poppins'
              }}
            >
              Clear
            </Button>
          </div>

          {/* Search Results Info */}
          {creditOrderSearchText && !creditOrdersLoading && (
            <div className="mb-3">
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins' }}>
                {creditOrders.length === 0 
                  ? `No results found for "${creditOrderSearchText}"` 
                  : `Found ${creditOrders.length} result${creditOrders.length === 1 ? '' : 's'} for "${creditOrderSearchText}"`
                }
              </p>
            </div>
          )}

          {/* Credit Orders Table */}
          {creditOrders.length === 0 && !creditOrdersLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg" style={{ fontFamily: 'Poppins' }}>
                {getNoDataMessage()}
              </p>
            </div>
          ) : (
            <Table
              dataSource={creditOrders}
              columns={creditOrdersColumns}
              rowKey="id"
              loading={creditOrdersLoading}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} orders`,
              }}
              size="middle"
              className="nested-table custom-pagination" 
              scroll={{ x: 700 }}
              style={{ fontFamily: 'Poppins' }}
              locale={{
                emptyText: getNoDataMessage()
              }}
            />
          )}
        </div>
      </Modal>

      {/* Create Customer Modal */}
      {showCreateCustomer && (
        <CreateCustomer
          fetchCustomers={handleCustomerCreated}
          setCreateCustomer={setCreateCustomer}
        />
      )}
      </div>
    </MainLayout>
  );
}