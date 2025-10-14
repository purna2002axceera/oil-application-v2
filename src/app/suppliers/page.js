'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Select } from 'antd';
import { DeleteOutlined, EditOutlined, ShoppingOutlined, PlusOutlined } from '@ant-design/icons';
import MainLayout from '../layouts/MainLayout';
import { customToast } from '../utils/toast';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isItemsModalVisible, setIsItemsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierItems, setSupplierItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      message.error('Failed to fetch suppliers: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all items for dropdown
  const fetchAllItems = useCallback(async () => {
    try {
      const response = await fetch(
        'http://localhost:8080/api/item/paginated?page=1&size=1000&sortBy=id&sortDir=DESC'
      );
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setAllItems(data.content || []);
    } catch (error) {
      message.error('Failed to fetch items: ' + error.message);
    }
  }, []);

  // Fetch supplier items
  const fetchSupplierItems = useCallback(async (supplierId) => {
    setItemsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/supplier-items/supplier/${supplierId}`
      );
      if (!response.ok) throw new Error('Failed to fetch supplier items');
      const data = await response.json();
      setSupplierItems(data);
    } catch (error) {
      message.error('Failed to fetch supplier items: ' + error.message);
      setSupplierItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handle create/update supplier
  const handleSubmit = async (values) => {
    try {
      const isEdit = !!editingSupplier;
      const url = 'http://localhost:8080/api/suppliers';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { id: editingSupplier.id, ...values } : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save supplier');
      
      message.success(`Supplier ${isEdit ? 'updated' : 'created'} successfully`);
      setIsModalVisible(false);
      form.resetFields();
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      message.error('Failed to save supplier: ' + error.message);
    }
  };

  // Handle delete supplier
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete supplier');
      message.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      message.error('Failed to delete supplier: ' + error.message);
    }
  };

  // Handle add item to supplier - FIXED VERSION
  const handleAddSupplierItem = async () => {
    if (!selectedItemId) {
      customToast('warning', 'Please select an item');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/supplier-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier.id,
          itemId: selectedItemId,
        }),
      });

      const data = await response.json();

      // Check if response is successful (2xx status codes)
      if (response.ok) {
        customToast('success', data.message || 'Item added successfully');
        setSelectedItemId(null);
        fetchSupplierItems(selectedSupplier.id);
        setIsItemsModalVisible(false);
      } else {
        // Handle error responses (4xx, 5xx)
        const errorMessage = data.message || data.error || 'Failed to add item';
        customToast('error', errorMessage);
        console.error('Error response:', data);
      }
      
    } catch (error) {
      // Handle network errors or parsing errors
      customToast('error', 'Network error: Unable to add item');
      console.error('Network error:', error);
    }
  };

  // Handle delete supplier item
  const handleDeleteSupplierItem = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/supplier-items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');
      message.success('Item removed successfully');
      fetchSupplierItems(selectedSupplier.id);
    } catch (error) {
      message.error('Failed to delete item: ' + error.message);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Open edit modal
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue({
      supplierName: supplier.supplierName,
      supplierPhone: supplier.supplierPhone,
      supplierAddress: supplier.supplierAddress,
    });
    setIsModalVisible(true);
  };

  // Open items modal
  const handleViewItems = (supplier) => {
    setSelectedSupplier(supplier);
    setIsItemsModalVisible(true);
    fetchSupplierItems(supplier.id);
    fetchAllItems();
  };

  // Supplier columns
  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: '25%',
    },
    {
      title: 'Phone',
      dataIndex: 'supplierPhone',
      key: 'supplierPhone',
      width: '20%',
    },
    {
      title: 'Address',
      dataIndex: 'supplierAddress',
      key: 'supplierAddress',
      width: '30%',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '15%',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: '#FC890D' }}
          />
          <Button
            type="link"
            icon={<ShoppingOutlined />}
            onClick={() => handleViewItems(record)}
            style={{ color: '#515151' }}
          />
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { background: '#FC890D', borderColor: '#FC890D' } }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Supplier items columns
  const itemColumns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: '80%',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Popconfirm
          title="Remove this item from supplier?"
          onConfirm={() => handleDeleteSupplierItem(record.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ style: { background: '#FC890D', borderColor: '#FC890D' } }}
        >
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <h1 
        className="text-2xl font-bold mb-6 w-full py-4 px-6"
        style={{ 
          background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', 
          color: '#515151',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        Supplier Management
      </h1>

      {mounted && (
        <div className="px-6">
          {/* Create Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors flex items-center gap-2"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
            >
              <PlusOutlined />
              Create Supplier
            </button>
          </div>

          {/* Suppliers Table */}
          <Table
            columns={columns}
            dataSource={suppliers}
            rowKey="id"
            loading={loading}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
            size="large"
            bordered
            scroll={{ x: 1000 }}
          />

          {/* Create/Edit Supplier Modal */}
          <Modal
            title={
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 'bold' }}>
                {editingSupplier ? 'Edit Supplier' : 'Create Supplier'}
              </span>
            }
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              form.resetFields();
              setEditingSupplier(null);
            }}
            footer={null}
            width={600}
          >
            <div className="bg-[#3D3B3B] p-6 rounded-lg">
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <div className="flex flex-col gap-1 mb-4">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Supplier Name
                  </label>
                  <Form.Item
                    name="supplierName"
                    rules={[{ required: true, message: 'Please enter supplier name' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Enter supplier name"
                      className="w-full"
                      style={{
                        height: 48,
                        borderRadius: 7,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 16,
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="flex flex-col gap-1 mb-4">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Phone
                  </label>
                  <Form.Item
                    name="supplierPhone"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Enter phone number"
                      className="w-full"
                      style={{
                        height: 48,
                        borderRadius: 7,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 16,
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="flex flex-col gap-1 mb-6">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Address
                  </label>
                  <Form.Item
                    name="supplierAddress"
                    rules={[{ required: true, message: 'Please enter address' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      placeholder="Enter address"
                      rows={3}
                      style={{
                        borderRadius: 7,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 16,
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-3 w-[150px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
                  >
                    {editingSupplier ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalVisible(false);
                      form.resetFields();
                      setEditingSupplier(null);
                    }}
                    className="px-6 py-3 w-[120px] bg-[#6B6B6B] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            </div>
          </Modal>

          {/* Supplier Items Modal */}
          <Modal
            title={
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 'bold' }}>
                Items supplied by {selectedSupplier?.supplierName || ''}
              </span>
            }
            open={isItemsModalVisible}
            onCancel={() => {
              setIsItemsModalVisible(false);
              setSelectedSupplier(null);
              setSupplierItems([]);
              setSelectedItemId(null);
            }}
            footer={null}
            width={900}
          >
            <div className="bg-[#3D3B3B] p-6 rounded-lg">
              <div className="mb-6">
                <label className="mb-2 text-white block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Add Item to Supplier
                </label>
                <div className="flex gap-3">
                  <Select
                    showSearch
                    placeholder="Select an item to add"
                    style={{ flex: 1, height: 48 }}
                    value={selectedItemId || undefined}
                    onChange={setSelectedItemId}
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={allItems.map((item) => ({
                      value: item.id,
                      label: `${item.itemCode} - ${item.itemBrand?.brandName || ''}`,
                    }))}
                    className="!shadow-md border-0"
                  />
                  <button
                    onClick={handleAddSupplierItem}
                    className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, height: 48 }}
                  >
                    Add Item
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-white mb-3" style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}>
                  Current Items
                </h3>
                <Table
                  columns={itemColumns}
                  dataSource={supplierItems}
                  rowKey="id"
                  loading={itemsLoading}
                  pagination={{ 
                    pageSize: 5,
                    showSizeChanger: false,
                  }}
                  size="middle"
                  bordered
                />
              </div>
            </div>
          </Modal>
        </div>
      )}
    </MainLayout>
  );
};

export default SupplierManagement;