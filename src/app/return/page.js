'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { customToast } from '../utils/toast'
import { Table, Button, InputNumber, Select, Popconfirm, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'


const ReturnPage = () => {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isLoose, setIsLoose] = useState(false)
  const [looseInMili, setLooseInMili] = useState('')
  const [returnItems, setReturnItems] = useState([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [ronumber, setRonumber] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allReturns, setAllReturns] = useState([])
  const [totalReturns, setTotalReturns] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [searchReturnNo, setSearchReturnNo] = useState('')
  const [searchCreatedAt, setSearchCreatedAt] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [mounted, setMounted] = useState(false);


  // Fetch all items and returns
  useEffect(() => {
    fetchItems()
    fetchPaginatedReturns()
    getCurrentReturnNumber()
  }, [])

  // Refetch returns when page, size, sort, or search changes
  useEffect(() => {
    if (mounted) fetchPaginatedReturns()
    // eslint-disable-next-line
  }, [page, size, sortBy, sortDir])

  useEffect(() => {
      setMounted(true);
    }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/item')
      setItems(res.data)
    } catch (err) {
      customToast('error', 'Failed to fetch items')
    }
  }


  // Fetch paginated and filtered returns
  const fetchPaginatedReturns = async (searching = false) => {
    setSearchLoading(searching)
    try {
      const params = {
        page: page - 1, // API is 0-indexed
        size,
        sortBy,
        sortDir,
      }
      if (searchReturnNo) params.ReturnNo = searchReturnNo
      if (searchCreatedAt) params.CreatedAt = searchCreatedAt
      const res = await axios.get('http://localhost:8080/api/return/allby', { params })
      setAllReturns(res.data.content || [])
      setTotalReturns(res.data.totalElements || 0)
    } catch (err) {
      customToast('error', 'Failed to fetch returns')
    }
    setSearchLoading(false)
  }

  // Generate next return order number
  const getCurrentReturnNumber = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/return/last-number')
      const data = res.data
      const year = new Date().getFullYear()
      if (data && data.trim() !== '' && data !== 'null' && data !== 'undefined') {
        const parts = data.split('-')
        if (parts.length === 3) {
          const lastNumber = parseInt(parts[2])
          if (!isNaN(lastNumber)) {
            const newNumber = lastNumber + 1
            const formattedNumber = `RET-${year}-${String(newNumber).padStart(3, '0')}`
            setRonumber(formattedNumber)
            return
          }
        }
      }
      setRonumber(`RET-${year}-001`)
    } catch (error) {
      const year = new Date().getFullYear()
      setRonumber(`RET-${year}-001`)
    }
  }

  useEffect(() => {
    calculateGrandTotal()
  }, [returnItems])

  const calculateGrandTotal = () => {
    setGrandTotal(returnItems.length)
  }

  const getItemName = (itemId) => {
    const item = items.find(item => item.id == itemId)
    return item ? `${item.itemBrand?.brandName || ''} - ${item.itemCode}` : ''
  }

  const resetForm = () => {
    setSelectedItem('')
    setQuantity('')
    setIsLoose(false)
    setLooseInMili('')
    setEditingIndex(null)
  }

  const resetAll = () => {
    resetForm()
    setReturnItems([])
    setGrandTotal(0)
    getCurrentReturnNumber()
  }

  const handleSelectItem = (value) => {
    setSelectedItem(value)
  }

  const handleAddItem = () => {
    if (!selectedItem) {
      customToast('error', 'Please select an item')
      return
    }
    if (isLoose) {
      if (!looseInMili || isNaN(looseInMili) || looseInMili <= 0) {
        customToast('error', 'Please enter amount in milliliters')
        return
      }
    } else {
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        customToast('error', 'Please enter quantity')
        return
      }
    }
    let quantityMiliLitres = null
    let quantityLitres = null
    if (isLoose) {
      quantityMiliLitres = parseInt(looseInMili)
      quantityLitres = parseFloat((quantityMiliLitres / 1000).toFixed(3))
    }
    const newItem = {
      itemId: parseInt(selectedItem),
      itemName: getItemName(selectedItem),
      isLoose: Boolean(isLoose),
      quantity: isLoose ? 0 : parseInt(quantity),
      quantityLitres: isLoose ? quantityLitres : 0,
      quantityMiliLitres: isLoose ? quantityMiliLitres : 0,
      createdAt: new Date().toISOString().slice(0, 19)
    }
    if (
      returnItems.some(
        (item, idx) =>
          item.itemId === newItem.itemId && idx !== editingIndex
      )
    ) {
      customToast('error', 'Item already added')
      return
    }
    let updatedItems
    if (editingIndex !== null) {
      updatedItems = [...returnItems]
      updatedItems[editingIndex] = newItem
    } else {
      updatedItems = [...returnItems, newItem]
    }
    setReturnItems(updatedItems)
    customToast('success', editingIndex !== null ? 'Item updated' : 'Item added')
    resetForm()
  }

  const handleSubmitReturn = async () => {
    if (returnItems.length === 0) {
      customToast('error', 'Please add at least one item')
      return
    }
    setIsSubmitting(true)
    const payload = {
      ronumber,
      createdAt: new Date().toISOString(),
      items: returnItems.map(item => ({
        itemId: item.itemId,
        quantity: item.isLoose ? 0 : item.quantity,
        quantityLitres: item.isLoose ? item.quantityLitres : 0,
        quantityMiliLitres: item.isLoose ? item.quantityMiliLitres : 0,
        isLoose: item.isLoose
      }))
    }
    try {
      await axios.post('http://localhost:8080/api/return', payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      customToast('success', 'Return submitted successfully')
      resetAll()
  fetchPaginatedReturns()
    } catch (err) {
      console.log(err);
      customToast('error', err.response?.data?.message || 'Failed to submit return')
    }
    setIsSubmitting(false)
  }

  // Updated nested columns - removed ML column, convert ML to L
  const nestedColumns = [
    { title: 'Item', dataIndex: 'itemName', key: 'itemName', width: 150 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (q, r) => r.isLoose ? '-' : q, width: 120 },
    { 
      title: 'Quantity (Liters)', 
      dataIndex: 'quantityMiliLitres', 
      key: 'quantityLitres', 
      render: (ml, record) => {
        if (record.isLoose) {
          // Convert milliliters to liters with 3 decimal places
          return ml ? (ml / 1000).toFixed(3) : '0.000';
        }
        return '-';
      }, 
      width: 120 
    },
    { title: 'Is Loose', dataIndex: 'isLoose', key: 'isLoose', render: v => v ? 'Yes' : 'No', width: 120 },
  ]

  const mainColumns = [
    { title: 'Return No', dataIndex: 'ronumber', key: 'ronumber', width: '40%', sorter: true },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', width: '35%', render: v => v?.split('T')[0], sorter: true },
    { title: 'Count', key: 'itemsCount', width: '20%', render: (_, record) => record.items?.length || 0 }
  ]

  const expandedRowRender = (record) => (
    <Table
      bordered
      dataSource={record.items.map((item, idx) => ({
        ...item,
        itemName: getItemName(item.itemId),
        key: idx
      }))}
      columns={nestedColumns}
      pagination={false}
      size="small"
      className="nested-table" 
      rowClassName="editable-row"
    />
  )

  const covertMLtoLitres = (ml) =>  ml ? (ml / 1000).toFixed(3) : '0.000';


  return (
    <MainLayout>
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 w-full py-4 px-6"
        style={{ background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', color: '#515151' }}>
        {editingIndex !== null ? 'Update Return Item' : 'Return Items'}
      </h1>

      {/* Form Section */}
     { mounted && <div className="space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg">
        <div className="flex flex-col gap-3 w-full">
          <div className='flex flex-col h-[80px] gap-1'>
            <label className='mb-1 text-white' style={{ fontFamily: 'Poppins, sans-serif' }}>Return Number</label>
            <input
              type="text"
              value={ronumber}
              readOnly
              className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-gray-100"
              style={{ 
                height: 48, 
                borderRadius: 7, 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: 16 
              }}
            />
          </div>

          <div className='flex flex-col h-[80px] gap-1'>
            <label className='mb-1 text-white' style={{ fontFamily: 'Poppins, sans-serif' }}>Select Item</label>
            <Select
              showSearch
              value={selectedItem || undefined}
              onChange={handleSelectItem}
              placeholder="Select an item"
              className='!shadow-md border-0'
              style={{ 
                width: '100%', 
                height: 48, 
                borderRadius: 12, 
                background: '#fff', 
                boxShadow: '0 2px 8px #f0f1f2', 
                fontFamily: 'Poppins, sans-serif' 
              }}
              optionFilterProp="label"
               filterSort={(optionA, optionB) =>
                 (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
               }
               options={items.map((item) => ({
                 value: item.id,
                 label: `${item.itemBrand.brandName} - ${item.itemCode}`,
               }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            checked={isLoose}
            onChange={e => setIsLoose(e.target.checked)}
            className="h-5 w-5 cursor-pointer"
            disabled={isSubmitting}
          />
          <label className="text-white cursor-pointer" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Is Loose
          </label>
        </div>

        {/* Quantity Inputs */}
        <div className="flex flex-col gap-5">
          {!isLoose && (
            <div className="flex flex-col gap-1 h-[80px] w-full">
              <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Quantity</label>
              <InputNumber
                min={1}
                value={quantity ? Number(quantity) : null}
                onChange={(value) => setQuantity(value)}
                className="w-full"
                style={{
                  width: "100%", 
                  height: 48,
                  borderRadius: 7,
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 16,
                  paddingTop:5
                }}
                disabled={isSubmitting}
              />
            </div>
          )}

          {isLoose && (
            <div className="flex flex-col w-full">
              <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Quantity In Millilitres</label>
              <InputNumber
                min={1}
                value={looseInMili ? Number(looseInMili) : null}
                onChange={(value) => setLooseInMili(value)}
                 formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
                 parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                className="w-full"
                style={{
                  width: "100%",
                  display: 'flex',
                  alignItems: 'center', 
                  height: 48,
                  borderRadius: 7,
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 16 
                }}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleAddItem}
            className="px-6 py-3 w-[200px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
            disabled={isSubmitting}
          >
            {editingIndex !== null ? 'Update Item' : 'Add Item'}
          </button>
          <button
            onClick={resetForm}
            className="px-6 py-3 w-[120px] bg-[#6B6B6B] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
            disabled={isSubmitting}
          >
            {editingIndex !== null ? 'Cancel' : 'Reset'}
          </button>
        </div>
      </div> }

      {/* Updated Items Table - removed ML column, convert ML to L */}
      { mounted && returnItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl text-white font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Added Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity (Liters)</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Is Loose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returnItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.isLoose ? '-' : item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.isLoose ? (item.quantityMiliLitres / 1000).toFixed(3) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.isLoose ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Total Items: {grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="flex space-x-4 mt-8">
            <button
              onClick={resetAll}
              className="px-6 py-3 w-[120px] bg-[#6B6B6B] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              onClick={handleSubmitReturn}
              className="px-6 py-3 w-[200px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#FD9A2E] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Return'}
            </button>
          </div>
        </div>
      )}

      {/* Search & Pagination Controls - Styled Card */}
      {mounted && (
        <div className="mt-12 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Filter Returns</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-gray-700">Search by Return No</label>
                <Input.Search
                  placeholder="Enter Return No"
                  value={searchReturnNo}
                  onChange={e => setSearchReturnNo(e.target.value)}
                  onSearch={() => { setPage(1); fetchPaginatedReturns(true); }}
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                  allowClear
                  enterButton
                  loading={searchLoading}
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-gray-700">Created At</label>
                <Input
                  type="date"
                  value={searchCreatedAt}
                  onChange={e => setSearchCreatedAt(e.target.value)}
                  style={{ width: 180 }}
                />
              </div>
              <Button
                onClick={() => {
                  setSearchReturnNo('');
                  setSearchCreatedAt('');
                  setPage(1);
                  fetchPaginatedReturns(true);
                }}
                style={{ height: 32 }}
              >
                Clear
              </Button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {searchReturnNo || searchCreatedAt ? (
                <p>
                  Filtering by
                  {searchReturnNo && ` Return No: "${searchReturnNo}"`}
                  {searchCreatedAt && ` Created At: ${searchCreatedAt}`}
                </p>
              ) : (
                <p>Showing all {totalReturns} returns</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Returns Expandable Table */}
     { mounted && <div className="mt-12">
        <h2 className="text-xl text-white font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>All Returns</h2>
        <Table
          columns={mainColumns}
          dataSource={allReturns}
          expandable={{
            expandedRowRender: expandedRowRender,
            defaultExpandedRowKeys: [],
            columnWidth: "100px",
          }}
          pagination={{
            current: page,
            pageSize: size,
            total: totalReturns,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            onChange: (p, s) => { setPage(p); setSize(s); },
          }}
          loading={searchLoading}
          onChange={(pagination, filters, sorter) => {
            if (sorter && sorter.field) {
              setSortBy(sorter.field);
              setSortDir(sorter.order === 'ascend' ? 'asc' : 'desc');
            }
          }}
          size="large"
          className="text-base"
          bordered
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div> }
    </MainLayout>
  )
}

export default ReturnPage