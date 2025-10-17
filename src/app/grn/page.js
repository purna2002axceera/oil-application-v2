'use client'

import React, { useEffect, useState, useCallback } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, Form, Input, InputNumber, Select, DatePicker, Modal, Popconfirm } from 'antd'
import moment from 'moment'

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
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }} rules={[{ required: true, message: `Please Input ${title}!` }]}>
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  )
}

const Page = () => {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [GrnNumber, setGrnNumber] = useState('')
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
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchGrnNumber, setSearchGrnNumber] = useState('')
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [editGrnItems, setEditGrnItems] = useState([])
  const [editGrandTotal, setEditGrandTotal] = useState(0)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingGrn, setEditingGrn] = useState(null)

  // ✅ get current GRN number
  const getCurrentGrnNumber = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/grn/last-number`)
      const data = res.data
      const year = new Date().getFullYear()
      if (data && data.trim() !== '' && data.includes('-')) {
        const parts = data.split('-')
        const lastNumber = parseInt(parts[2])
        if (!isNaN(lastNumber)) {
          const newNumber = lastNumber + 1
          setGrnNumber(`GRN-${year}-${String(newNumber).padStart(3, '0')}`)
          return
        }
      }
      setGrnNumber(`GRN-${year}-001`)
    } catch {
      const year = new Date().getFullYear()
      setGrnNumber(`GRN-${year}-001`)
    }
  }, [])

  // ✅ fetch items
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/item')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error('Error fetching items', err)
    }
  }, [])

  // ✅ get item name
  const getItemName = useCallback(
    (id) => {
      const item = items.find((i) => i.id === id)
      return item ? `${item.itemBrand.brandName} - ${item.itemCode}` : ''
    },
    [items]
  )

  // ✅ auto total
  const autoCalculateTotalPrice = useCallback(() => {
    if (quantity && itemUnitPrice) {
      setTotalPrice(parseFloat(quantity) * parseFloat(itemUnitPrice))
    } else {
      setTotalPrice('')
    }
  }, [quantity, itemUnitPrice])

  // ✅ grand total
  const calculateGrandTotal = useCallback(() => {
    const total = grnItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0)
    setGrandTotal(total)
  }, [grnItems])

  // ✅ edit grand total
  const calculateEditGrandTotal = useCallback(() => {
    const total = editGrnItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0)
    setEditGrandTotal(total)
  }, [editGrnItems])

  // ✅ fetch all GRNs
  const fetchAllGrns = useCallback(
    async (pageNum = 1, pageSz = 10) => {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:8080/api/grn/paginated?page=${pageNum - 1}&size=${pageSz}`)
        const data = await res.json()
        const formatted = (data.content || []).map((grn) => ({
          ...grn,
          createdAt: grn.createdAt?.split('T')[0],
          key: grn.id,
          items: grn.items?.map((item) => ({
            ...item,
            key: `${grn.id}-${item.id}`,
            itemName: getItemName(item.itemId),
          })),
        }))
        setAllGrns(formatted)
      } catch (err) {
        console.error(err)
        customToast('error', 'Error fetching GRNs')
      } finally {
        setLoading(false)
      }
    },
    [getItemName]
  )

  useEffect(() => {
    setMounted(true)
    getCurrentGrnNumber()
    fetchItems()
  }, [getCurrentGrnNumber, fetchItems])

  useEffect(() => {
    if (mounted) fetchAllGrns(1, pageSize)
  }, [mounted, fetchAllGrns, pageSize])

  useEffect(() => {
    autoCalculateTotalPrice()
  }, [autoCalculateTotalPrice])

  useEffect(() => {
    calculateGrandTotal()
  }, [calculateGrandTotal])

  useEffect(() => {
    calculateEditGrandTotal()
  }, [calculateEditGrandTotal])

  // ✅ handlers
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
      invoiceNumber,
      createdAt: new Date().toISOString(),
    }

    if (grnItems.some((i) => i.itemId === parseInt(selectedItem))) {
      customToast('error', 'Item already added')
      return
    }

    setGrnItems([...grnItems, newItem])
    resetForm()
    customToast('success', 'Item added successfully')
  }

  const handleCreateGRN = async () => {
    if (!invoiceNumber || grnItems.length === 0) {
      customToast('error', 'Please add invoice and at least one item')
      return
    }

    const payload = {
      GrnNumber,
      invoiceNumber,
      totalAmount: grandTotal,
      createdAt: new Date().toISOString(),
      items: grnItems,
    }

    try {
      await axios.post('http://localhost:8080/api/grn', payload)
      customToast('success', 'GRN created successfully')
      resetAll()
      fetchAllGrns()
    } catch (err) {
      customToast('error', 'Error creating GRN')
    }
  }

  const handleDeleteGrn = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/grn/${id}`)
      customToast('success', 'GRN deleted')
      fetchAllGrns(currentPage, pageSize)
    } catch (err) {
      customToast('error', 'Error deleting GRN')
    }
  }

  // ✅ columns
  const mainColumns = [
    { title: 'GRN Number', dataIndex: 'GrnNumber', key: 'GrnNumber' },
    { title: 'Invoice No', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => v?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => (
        <Popconfirm title="Delete GRN?" onConfirm={() => handleDeleteGrn(r.id)}>
          <Button icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      ),
    },
  ]

  const expandedRowRender = (r) => (
    <Table
      dataSource={r.items}
      pagination={false}
      columns={[
        { title: 'Item', dataIndex: 'itemName' },
        { title: 'Qty', dataIndex: 'quantity' },
        { title: 'Price', dataIndex: 'unitPrice' },
        { title: 'Total', dataIndex: 'totalPrice' },
      ]}
      size="small"
    />
  )

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6 w-full py-4 px-6 bg-gray-200 text-gray-700">Purchase Orders</h1>
      <div className="p-6 bg-[#3D3B3B] rounded-lg">
        <div className="mb-4">
          <label className="text-white mb-1 block">Invoice Number</label>
          <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Invoice No" />
        </div>
        <div className="mb-4">
          <label className="text-white mb-1 block">Supplier Name</label>
          <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier" />
        </div>
        <div className="mb-4">
          <label className="text-white mb-1 block">Select Item</label>
          <Select
            value={selectedItem || undefined}
            onChange={(v) => setSelectedItem(v)}
            options={items.map((i) => ({ value: i.id, label: `${i.itemBrand.brandName} - ${i.itemCode}` }))}
          />
        </div>
        <div className="flex gap-4">
          <InputNumber value={quantity} onChange={setQuantity} placeholder="Qty" />
          <InputNumber value={itemUnitPrice} onChange={setItemUnitPrice} placeholder="Unit Price" />
          <InputNumber value={totalPrice} readOnly placeholder="Total" />
          <Button type="primary" onClick={handleAddItem}>
            Add
          </Button>
        </div>
      </div>

      {grnItems.length > 0 && (
        <div className="mt-6">
          <Table
            columns={[
              { title: 'Item', dataIndex: 'itemName' },
              { title: 'Qty', dataIndex: 'quantity' },
              { title: 'Price', dataIndex: 'unitPrice' },
              { title: 'Total', dataIndex: 'totalPrice' },
            ]}
            dataSource={grnItems}
            pagination={false}
          />
          <div className="mt-4 text-right text-white font-bold">Grand Total: {grandTotal.toFixed(2)}</div>
          <div className="mt-4 flex gap-3">
            <Button onClick={resetAll}>Reset</Button>
            <Button type="primary" onClick={handleCreateGRN}>
              Create GRN
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Table
          loading={loading}
          columns={mainColumns}
          expandable={{ expandedRowRender }}
          dataSource={allGrns}
          pagination={{ pageSize }}
        />
      </div>
    </MainLayout>
  )
}

export default Page
