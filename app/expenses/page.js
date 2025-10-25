'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, InputNumber, Popconfirm, Space, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import MainLayout from '../layouts/MainLayout';
import { customToast } from '../utils/toast';
import dayjs from 'dayjs';
import axios from 'axios';

const Expenses = () => {
  const [expenseLogs, setExpenseLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form] = Form.useForm();
  const [createExpenseForm] = Form.useForm();

  const API_BASE_URL = 'http://localhost:8080/api/expenses';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all expenses
  const fetchExpenses = useCallback(async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setExpenses(response.data);
    } catch (error) {
      customToast('error', `Failed to fetch expenses: ${error.response?.data?.message || error.message}`);
    }
  }, []);

  // Fetch all expense logs
  const fetchExpenseLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/logs`);
      setExpenseLogs(response.data);
    } catch (error) {
      customToast('error', `Failed to fetch expense logs: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new expense type
  const handleCreateExpense = async (values) => {
    try {
      await axios.post(API_BASE_URL, {
        expenseName: values.expenseName
      });
      customToast('success', 'Expense type created successfully');
      setIsCreateExpenseModalOpen(false);
      createExpenseForm.resetFields();
      fetchExpenses();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      customToast('error', `Failed to create expense: ${errorMessage}`);
    }
  };

  // Delete expense type
  const handleDeleteExpense = async (expenseId, expenseName) => {
    try {
      await axios.delete(`${API_BASE_URL}/${expenseId}`);
      customToast('success', `Expense type "${expenseName}" deleted successfully`);
      fetchExpenses();
      // Reset the form field if the deleted expense was selected
      const currentExpenseId = form.getFieldValue('expenseId');
      if (currentExpenseId === expenseId) {
        form.setFieldsValue({ expenseId: undefined });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      customToast('error', `Failed to delete expense: ${errorMessage}`);
    }
  };

  // Add new expense log
  const handleAddExpenseLog = async (values) => {
    try {
      const payload = {
        expenseId: values.expenseId,
        date: values.date.format('YYYY-MM-DD'),
        amount: values.amount
      };

      await axios.post(`${API_BASE_URL}/logs`, payload);
      customToast('success', 'Expense log added successfully');
      setIsModalOpen(false);
      form.resetFields();
      fetchExpenseLogs();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      customToast('error', `Failed to add expense log: ${errorMessage}`);
    }
  };

  // Delete expense log
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/logs/${id}`);
      customToast('success', 'Expense log deleted successfully');
      fetchExpenseLogs();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      customToast('error', `Failed to delete expense log: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchExpenseLogs();
  }, [fetchExpenses, fetchExpenseLogs]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '8%',
    },
    {
      title: 'Expense Type',
      dataIndex: 'expenseName',
      key: 'expenseName',
      width: '30%',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '20%',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Amount (LKR)',
      dataIndex: 'amount',
      key: 'amount',
      width: '32%',
      render: (amount) => new Intl.NumberFormat('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this expense log?"
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
        Expense Management
      </h1>

      {mounted && (
        <div className="px-6">
          {/* Create Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors flex items-center gap-2"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
            >
              <PlusOutlined />
              Add Expense Log
            </button>
          </div>

          {/* Expense Logs Table */}
          <Table
            columns={columns}
            dataSource={expenseLogs}
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

          {/* Add Expense Log Modal */}
          <Modal
            title={
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 'bold' }}>
                Add New Expense Log
              </span>
            }
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              form.resetFields();
            }}
            footer={null}
            width={600}
          >
            <div className="bg-[#3D3B3B] p-6 rounded-lg">
              <Form form={form} layout="vertical" onFinish={handleAddExpenseLog}>
                <div className="flex flex-col gap-1 mb-4">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Expense Type
                  </label>
                  <div className="flex gap-2">
                    <Form.Item
                      name="expenseId"
                      rules={[{ required: true, message: 'Please select expense type' }]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <Select
                        placeholder="Select expense type"
                        showSearch
                        optionFilterProp="children"
                        style={{
                          height: 48,
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: 16,
                        }}
                        filterSort={(optionA, optionB) =>
                          (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                        }
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                          </>
                        )}
                      >
                        {expenses.map((expense) => (
                          <Select.Option key={expense.id} value={expense.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{expense.expenseName}</span>
                              <Popconfirm
                                title={`Delete "${expense.expenseName}"?`}
                                description="Are you sure you want to delete this expense type?"
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDeleteExpense(expense.id, expense.expenseName);
                                }}
                                onCancel={(e) => e?.stopPropagation()}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ style: { background: '#FC890D', borderColor: '#FC890D' } }}
                              >
                                <DeleteOutlined 
                                  className="text-red-500 hover:text-red-700"
                                  style={{ fontSize: 14 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                />
                              </Popconfirm>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<PlusOutlined />}
                      onClick={() => setIsCreateExpenseModalOpen(true)}
                      style={{
                        width: 48,
                        height: 48,
                        background: '#FC890D',
                        borderColor: '#FC890D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      className="hover:bg-[#fc890de9]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-4">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Date
                  </label>
                  <Form.Item
                    name="date"
                    rules={[{ required: true, message: 'Please select date' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <DatePicker 
                      style={{ 
                        width: '100%',
                        height: 48,
                        borderRadius: 7,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 16,
                      }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </div>

                <div className="flex flex-col gap-1 mb-6">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Amount (LKR)
                  </label>
                  <Form.Item
                    name="amount"
                    rules={[
                      { required: true, message: 'Please enter amount' },
                      { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      style={{ 
                        width: '100%',
                        height: 48,
                        borderRadius: 7,
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 16,
                      }}
                      placeholder="Enter amount"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                      precision={2}
                    />
                  </Form.Item>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-3 w-[150px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      form.resetFields();
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

          {/* Create Expense Type Modal */}
          <Modal
            title={
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 'bold' }}>
                Create New Expense Type
              </span>
            }
            open={isCreateExpenseModalOpen}
            onCancel={() => {
              setIsCreateExpenseModalOpen(false);
              createExpenseForm.resetFields();
            }}
            footer={null}
            width={500}
          >
            <div className="bg-[#3D3B3B] p-6 rounded-lg">
              <Form form={createExpenseForm} layout="vertical" onFinish={handleCreateExpense}>
                <div className="flex flex-col gap-1 mb-6">
                  <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Expense Name
                  </label>
                  <Form.Item
                    name="expenseName"
                    rules={[
                      { required: true, message: 'Please enter expense name' },
                      { whitespace: true, message: 'Expense name cannot be empty' }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Enter expense name"
                      style={{
                        height: 48,
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
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateExpenseModalOpen(false);
                      createExpenseForm.resetFields();
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
        </div>
      )}
    </MainLayout>
  );
};

export default Expenses;