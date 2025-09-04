'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, InputNumber, Select, Popconfirm } from 'antd'

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
  const inputNode = inputType === 'number' ? <InputNumber /> : <input />
  return (
    <td {...restProps}>
      {editing ? (
        <div style={{ margin: 0 }}>
          {inputNode}
        </div>
      ) : (
        children
      )}
    </td>
  )
}

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
  // Search/filter states
  const [searchReturnNo, setSearchReturnNo] = useState('')
  const [searchCreatedAt, setSearchCreatedAt] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  // Fetch all items and returns
  useEffect(() => {
    fetchItems()
    fetchAllReturns()
    getCurrentReturnNumber()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/item')
      setItems(res.data)
    } catch (err) {
      customToast('error', 'Failed to fetch items')
    }
  }

  const fetchAllReturns = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/return')
      setAllReturns(res.data.slice().reverse())
    } catch (err) {
      customToast('error', 'Failed to fetch returns')
    }
  }

  // Search API call
  const fetchFilteredReturns = async (params = {}) => {
    setSearchLoading(true)
    try {
      const query = new URLSearchParams({
        page: 0,
        size: 50,
        sortBy: 'createdAt',
        sortDir: 'desc',
        ...(params.ReturnNo ? { ReturnNo: params.ReturnNo } : {}),
        ...(params.CreatedAt ? { CreatedAt: params.CreatedAt } : {})
      }).toString()
      const res = await axios.get(`http://localhost:8080/api/return/allby?${query}`)
      setAllReturns(res.data.content || [])
    } catch (err) {
      customToast('error', 'Failed to search returns')
    }
    setSearchLoading(false)
  }

  const handleSearch = () => {
    fetchFilteredReturns({
      ReturnNo: searchReturnNo,
      CreatedAt: searchCreatedAt
    })
  }

  const handleClearSearch = () => {
    setSearchReturnNo('')
    setSearchCreatedAt('')
    fetchAllReturns()
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

  const handleRemoveItem = (index) => {
    const updatedItems = returnItems.filter((_, i) => i !== index)
    setReturnItems(updatedItems)
    customToast('success', 'Item removed')
  }

  const handleUpdateItem = (index) => {
    const item = returnItems[index]
    setSelectedItem(item.itemId.toString())
    setIsLoose(Boolean(item.isLoose))
    setQuantity(item.quantity?.toString() || '')
    setLooseInMili(item.quantityMiliLitres?.toString() || '')
    setEditingIndex(index)
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
      fetchAllReturns()
    } catch (err) {
      customToast('error', 'Failed to submit return')
    }
    setIsSubmitting(false)
  }

  // Expandable table for all returns
  const nestedColumns = [
    { title: 'Item', dataIndex: 'itemName', key: 'itemName', width: 150 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (q, r) => r.isLoose ? '-' : q, width: 120 },
    { title: 'Quantity ML', dataIndex: 'quantityMiliLitres', key: 'quantityMiliLitres', render: (q, r) => r.isLoose ? q : '-', width: 120 },
    { title: 'Quantity L', dataIndex: 'quantityLitres', key: 'quantityLitres', render: (q, r) => r.isLoose ? q : '-', width: 120 },
    { title: 'Is Loose', dataIndex: 'isLoose', key: 'isLoose', render: v => v ? 'Yes' : 'No', width: 120 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record, idx) => (
        <div className="flex gap-2 justify-center">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleUpdateItem(idx)} 
            style={{ borderRadius: 50, padding: '0 15px' }}
          />
          <Popconfirm
            title="Remove Item"
            description="Are you sure to remove this item?"
            onConfirm={() => handleRemoveItem(idx)}
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
              style={{ borderRadius: 50, padding: '0 15px' }}
            />
          </Popconfirm>
        </div>
      )
    }
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
      rowClassName="editable-row"
    />
  )

  return (
    <MainLayout>
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 w-full py-4 px-6 rounded-lg"
        style={{ background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', color: '#515151' }}>
        {editingIndex !== null ? 'Update Return Item' : 'Return Items'}
      </h1>

      

      {/* Form Section */}
      <div className="space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg">
        <div className="flex flex-col gap-5 w-full">
          <div className='flex flex-col w-full'>
            <label className='mb-1 text-white' style={{ fontFamily: 'Poppins, sans-serif' }}>Return Number</label>
            <input
              type="text"
              value={ronumber}
              readOnly
              className="w-full px-4 py-3 rounded-lg shadow-md focus:outline-none focus:ring-0 border-0 bg-gray-100"
              style={{ 
                height: 48, 
                borderRadius: 12, 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: 16 
              }}
            />
          </div>

          <div className='flex flex-col w-full'>
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
              options={items.map(item => ({
                value: item.id,
                label: getItemName(item.id)
              }))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 py-4">
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
            <div className="flex flex-col w-full">
              <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Quantity</label>
              <InputNumber
                min={1}
                value={quantity ? Number(quantity) : null}
                onChange={(value) => setQuantity(value)}
                className="w-full"
                style={{
                  width: "100%", 
                  height: 48,
                  borderRadius: 12,
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
                className="w-full"
                style={{
                  width: "100%", 
                  height: 48,
                  borderRadius: 12,
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
            className="px-6 py-3 w-[120px] bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
            disabled={isSubmitting}
          >
            {editingIndex !== null ? 'Cancel' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="mb-8 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-wrap gap-4 items-end">
          {/* Return No Input */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Return No</label>
            <input
              type="text"
              placeholder="Enter Return No"
              value={searchReturnNo}
              onChange={e => setSearchReturnNo(e.target.value)}
              className="w-[180px] h-[33px] text-sm px-3 py-2 rounded shadow border border-gray-300 text-gray-700"
            />
          </div>
          {/* Created At Input */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">Created At</label>
            <input
              type="date"
              value={searchCreatedAt}
              onChange={e => setSearchCreatedAt(e.target.value)}
              className="w-[180px] h-[33px] text-sm px-3 py-2 rounded shadow border border-gray-300 text-gray-700"
            />
          </div>
          {/* Search & Clear Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={searchLoading}
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
                cursor: searchLoading ? 'not-allowed' : 'pointer',
                opacity: searchLoading ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#FD9A2E'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#FC890D'}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleClearSearch}
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
        </div>
      </div>

      {/* Items Table */}
      {returnItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl text-white font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Added Items</h2>
          <Table
            dataSource={returnItems.map((item, index) => ({
              ...item,
              key: index
            }))}
            columns={nestedColumns}
            pagination={false}
            size="large"
            className="text-base"
            bordered
            scroll={{ x: 1000 }}
            summary={(pageData) => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong style={{ fontFamily: 'Poppins, sans-serif' }}>Total Items:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong style={{ fontFamily: 'Poppins, sans-serif' }}>{grandTotal}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
          
          <div className="flex space-x-4 mt-8">
            <button
              onClick={resetAll}
              className="px-6 py-3 w-[120px] bg-[#AAA69F] text-white rounded-lg shadow-md hover:bg-[#646363] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              onClick={handleSubmitReturn}
              className="px-6 py-3 w-[200px] bg-[#FC890D] text-white rounded-lg shadow-md hover:bg-[#fc890de9] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Return'}
            </button>
          </div>
        </div>
      )}

      {/* All Returns Expandable Table */}
      <div className="mt-12">
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
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          size="large"
          className="text-base"
          bordered
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div>
    </MainLayout>
  )
}

export default ReturnPage