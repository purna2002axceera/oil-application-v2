'use client'

import React, { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { Table, Button, Select, InputNumber, Modal } from 'antd'
import { customToast } from '../utils/toast'

const ReturnPage = () => {
  const [allGrns, setAllGrns] = useState([])
  const [selectedGrnId, setSelectedGrnId] = useState(null)
  const [grnItems, setGrnItems] = useState([])
  const [returnItems, setReturnItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all GRNs (purchase orders)
  useEffect(() => {
    const fetchGrns = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/grn')
        setAllGrns(res.data)
      } catch (err) {
        customToast('error', 'Failed to fetch GRNs')
      }
    }
    fetchGrns()
  }, [])

  // When a GRN is selected, load its items
  useEffect(() => {
    if (!selectedGrnId) {
      setGrnItems([])
      setReturnItems([])
      return
    }
    const grn = allGrns.find(g => g.id === selectedGrnId)
    if (grn) {
      setGrnItems(grn.items)
      setReturnItems(grn.items.map(item => ({
        ...item,
        returnQty: 0
      })))
    }
  }, [selectedGrnId, allGrns])

  const handleQtyChange = (itemId, value) => {
    setReturnItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, returnQty: Math.max(0, Math.min(item.quantity, Number(value))) }
          : item
      )
    )
  }

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems.filter(item => item.returnQty > 0)
    if (itemsToReturn.length === 0) {
      customToast('error', 'Select at least one item and quantity to return')
      return
    }
    setIsSubmitting(true)
    try {
      // Adjust endpoint and payload as per your backend
      await axios.post('http://localhost:8080/api/return', {
        grnId: selectedGrnId,
        items: itemsToReturn.map(item => ({
          itemId: item.itemId,
          quantity: item.returnQty
        }))
      })
      customToast('success', 'Return submitted successfully')
      setSelectedGrnId(null)
      setGrnItems([])
      setReturnItems([])
    } catch (err) {
      customToast('error', 'Failed to submit return')
    }
    setIsSubmitting(false)
  }

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6 w-full py-4 px-6 rounded-lg"
        style={{ background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', color: '#515151' }}>
        Return Items
      </h1>

      {/* Select Purchase Order */}
      <div className="mb-6 w-[60%]">
        <label className="mb-2 block text-white">Select Purchase Order</label>
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="Select a Purchase Order"
          value={selectedGrnId || undefined}
          onChange={setSelectedGrnId}
          options={allGrns.map(grn => ({
            value: grn.id,
            label: `${grn.grnNumber} (${grn.invoiceNumber})`
          }))}
        />
      </div>

      {/* Items Table */}
      {grnItems.length > 0 && (
        <div className="mt-8 w-[80%]">
          <h2 className="text-xl font-semibold text-white mb-4">Returnable Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Purchased Qty</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Return Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returnItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.itemName || item.itemId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      <InputNumber
                        min={0}
                        max={item.quantity}
                        value={item.returnQty}
                        onChange={val => handleQtyChange(item.id, val)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="primary"
            className="mt-6 bg-[#FC890D] hover:bg-[#FD9A2E]"
            onClick={handleSubmitReturn}
            loading={isSubmitting}
          >
            Submit Return
          </Button>
        </div>
      )}
    </MainLayout>
  )
}

export default ReturnPage;