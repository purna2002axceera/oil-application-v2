'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { customToast } from '../utils/toast'
import { Table, Button, Input, InputNumber, Select, Form } from 'antd'

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
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Please Input ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
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
  const [itemUnitPrice, setItemUnitPrice] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [returnItems, setReturnItems] = useState([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [ronumber, setRonumber] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allReturns, setAllReturns] = useState([])

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
      setAllReturns(res.data)
    } catch (err) {
      customToast('error', 'Failed to fetch returns')
    }
  }

  // Inject Poppins font for Select placeholder
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        .poppins-select .ant-select-selection-placeholder,
        .poppins-placeholder {
          font-family: 'Poppins', sans-serif !important;
          color: #000 !important;
          font-weight: regular !important;
          opacity: 0.5 !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

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
    autoCalculateTotalPrice()
  }, [quantity, itemUnitPrice, looseInMili, isLoose])

  useEffect(() => {
    calculateGrandTotal()
  }, [returnItems])

  const autoCalculateTotalPrice = () => {
    if (isLoose && itemUnitPrice && looseInMili) {
      setTotalPrice((parseFloat(itemUnitPrice) * parseFloat(looseInMili) / 1000).toFixed(2))
    } else if (!isLoose && quantity && itemUnitPrice) {
      setTotalPrice((parseFloat(quantity) * parseFloat(itemUnitPrice)).toFixed(2))
    } else {
      setTotalPrice('')
    }
  }

  const calculateGrandTotal = () => {
    const total = returnItems.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0)
    setGrandTotal(total)
  }

  const getItemName = (itemId) => {
    const item = items.find(item => item.id == itemId)
    return item ? `${item.itemBrand?.brandName || ''} - ${item.itemCode}` : ''
  }

  const resetForm = () => {
    setSelectedItem('')
    setQuantity('')
    setItemUnitPrice('')
    setTotalPrice('')
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
    const item = items.find(i => i.id === value)
    if (item) setItemUnitPrice(item.unitPrice || '')
  }

  const handleAddItem = () => {
    if (!selectedItem || !itemUnitPrice) {
      customToast('error', 'Please fill all fields')
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
      quantity: isLoose ? '' : parseInt(quantity),
      quantityLitres: isLoose ? quantityLitres : 0,
      quantityMiliLitres: isLoose ? quantityMiliLitres : 0,
      unitPrice: parseFloat(itemUnitPrice),
      totalAmount: parseFloat(totalPrice),
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
    setItemUnitPrice(item.unitPrice.toString())
    setTotalPrice(item.totalAmount.toString())
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
      totalAmount: parseFloat(grandTotal),
      createdAt: new Date().toISOString(),
      items: returnItems.map(item => ({
        itemId: item.itemId,
        quantity: item.isLoose ? 0 : item.quantity,
        quantityLitres: item.isLoose ? item.quantityLitres : 0,
        quantityMiliLitres: item.isLoose ? item.quantityMiliLitres : 0,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
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
    { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (q, r) => r.isLoose ? '-' : q },
    { title: 'Quantity ML', dataIndex: 'quantityMiliLitres', key: 'quantityMiliLitres', render: (q, r) => r.isLoose ? q : '-' },
    { title: 'Quantity L', dataIndex: 'quantityLitres', key: 'quantityLitres', render: (q, r) => r.isLoose ? q : '-' },
    { title: 'Is Loose', dataIndex: 'isLoose', key: 'isLoose', render: v => v ? 'Yes' : 'No' },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: v => v?.toFixed(2) },
    { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: v => v?.toFixed(2) },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, idx) => (
        <div className="flex gap-2 justify-center">
          <Button icon={<EditOutlined />} size="small" onClick={() => handleUpdateItem(idx)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleRemoveItem(idx)} />
        </div>
      )
    }
  ]

  const mainColumns = [
    { title: 'Return No', dataIndex: 'ronumber', key: 'ronumber', width: '18%' },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', width: '18%', render: v => v?.split('T')[0] },
    { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', width: '18%', render: v => v?.toFixed(2) },
    { title: 'Count', key: 'itemsCount', width: '10%', render: (_, record) => record.items?.length || 0 }
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
      <h1 className="text-2xl font-bold mb-6 w-full py-4 px-6 rounded-lg"
        style={{ background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', color: '#515151' }}>
        Return Items
      </h1>
      {/* Form Section */}
      <div className='flex flex-col w-[60%] bg-[#3D3B3B] gap-2 px-8 py-8 rounded-lg'>
        <div className="flex w-full flex-col gap-1">
          <label className='mb-1 text-white'>Return Number</label>
          <Input value={ronumber}  className="w-full px-4 py-3 rounded-lg shadow-md bg-white " />
        </div>
        <div className="flex w-full flex-col gap-1">
          <label className='mb-1 text-white'>Select Item</label>

          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={<span className="poppins-placeholder">Select an item</span>}
            value={selectedItem || undefined}
            onChange={handleSelectItem}
            options={items.map(item => ({
              value: item.id,
              label: getItemName(item.id)
            }))}
            className="poppins-select"
          />

  
        </div>
        <div className="flex items-center gap-2 py-4">
          <input
            type="checkbox"
            checked={isLoose}
            onChange={e => setIsLoose(e.target.checked)}
            className="h-5 w-5 cursor-pointer"
          />
          <label className="text-white cursor-pointer">Is Loose</label>
        </div>
        {!isLoose && (
          <div className="flex w-full flex-col gap-1">
            <label className='mb-1 text-white'>Quantity</label>
            <InputNumber
              min={1}
              value={quantity}
              onChange={setQuantity}
              className="w-full px-4 py-3 rounded-lg shadow-md bg-white"
            />
          </div>
        )}
        {isLoose && (
          <div className="flex w-full flex-col gap-1">
            <label className='mb-1 text-white'>Quantity In Millilitres</label>
            <InputNumber
              min={1}
              value={looseInMili}
              onChange={setLooseInMili}
              className="w-full px-4 py-3 rounded-lg shadow-md bg-white"
            />
          </div>
        )}
        <div className="flex w-full flex-col gap-1">
          <label className='mb-1 text-white'>Item Unit Price</label>
          <InputNumber
            min={0}
            value={itemUnitPrice}
            onChange={setItemUnitPrice}
            className="w-full px-4 py-3 rounded-lg shadow-md bg-white"
          />
        </div>
        <div className="flex w-full flex-col gap-1">
          <label className='mb-1 text-white'>Total Price</label>
          <InputNumber
            value={totalPrice}
            readOnly
            className="w-full px-4 py-3 rounded-lg shadow-md bg-white"
          />
        </div>
        <div className="flex gap-4 mt-6">
          <Button onClick={resetForm} className="bg-[#AAA69F] text-white">Cancel</Button>
          <Button onClick={handleAddItem} className="bg-[#FC890D] text-white">{editingIndex !== null ? 'Update Item' : 'Add Item'}</Button>
        </div>
      </div>

      {/* Items Table */}
      {returnItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Added Items</h2>
          <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-md">
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity ML</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity L</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Is Loose</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Price</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {returnItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantityMiliLitres}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantityLitres}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.isLoose ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.totalAmount.toFixed(2)}</td>
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
          <div className="flex gap-4 mt-8">
            <Button onClick={resetAll} className="bg-[#AAA69F] text-white">Reset</Button>
            <Button type="primary" loading={isSubmitting} onClick={handleSubmitReturn} className="bg-[#FC890D] text-white">
              Submit Return
            </Button>
          </div>
        </div>
      )}

      {/* All Returns Expandable Table */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-white">All Returns</h2>
        <Table
          columns={mainColumns.map(col => ({
            ...col,
            width: col.key === 'ronumber' ? '35%' :
                   col.key === 'createdAt' ? '25%' :
                   col.key === 'totalAmount' ? '18%' :
                   col.key === 'itemsCount' ? '10%' : undefined
          }))}
          dataSource={allReturns}
          expandable={{
            expandedRowRender: record => (
              <Table
                bordered
                dataSource={record.items.map((item, idx) => ({
                  ...item,
                  itemName: getItemName(item.itemId),
                  key: idx
                }))}
                columns={nestedColumns.map(col => ({
                  ...col,
                  width: col.key === 'itemName' ? '18%' :
                         col.key === 'quantity' ? '10%' :
                         col.key === 'quantityMiliLitres' ? '12%' :
                         col.key === 'quantityLitres' ? '12%' :
                         col.key === 'isLoose' ? '10%' :
                         col.key === 'unitPrice' ? '12%' :
                         col.key === 'totalAmount' ? '12%' : undefined
                }))}
                pagination={false}
                size="small"
                rowClassName="editable-row"
              />
            ),
            defaultExpandedRowKeys: [],
            columnWidth: "100px",
          }}
          pagination={{ pageSize: 10 }}
          size="large"
          className="text-base"
          bordered
          rowKey="id"
        />
      </div>
    </MainLayout>
  )
}

export default ReturnPage