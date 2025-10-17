"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Input, InputNumber, Table, DatePicker, Button } from "antd";
import MainLayout from '../layouts/MainLayout'
import axios from 'axios'
import { toast } from "react-toastify";
import { Select } from "antd";
import { SearchOutlined } from '@ant-design/icons'

export default function ReturnPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isLoose, setIsLoose] = useState(false);
  const [quantityLitres, setQuantityLitres] = useState("");
  const [quantityMiliLitres, setQuantityMiliLitres] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [returnNumber, setReturnNumber] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [returns, setReturns] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [searchReturnNo, setSearchReturnNo] = useState("");
  const [searchCreatedAt, setSearchCreatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  // ✅ Define callbacks BEFORE useEffect that calls them
  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/item");
      setItems(res.data);
    } catch (error) {
      toast.error("Failed to fetch items");
    }
  }, []);

  const fetchReturns = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const params = {
          page: page - 1,
          size: pageSize,
          sortBy,
          sortDir,
        };
        if (searchReturnNo) params.ReturnNo = searchReturnNo;
        if (searchCreatedAt) params.CreatedAt = searchCreatedAt;
        const res = await axios.get("http://localhost:8080/api/return/allby", {
          params,
        });
        setReturns(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
      } catch (error) {
        toast.error("Failed to fetch returns");
      }
      setLoading(false);
    },
    [page, pageSize, sortBy, sortDir, searchReturnNo, searchCreatedAt]
  );

  const fetchLastNumber = useCallback(async () => {
    try {
      const last = (await axios.get("http://localhost:8080/api/return/last-number"))
        .data;
      const year = new Date().getFullYear();
      if (last && last.trim() && last !== "null" && last !== "undefined") {
        const parts = last.split("-");
        if (parts.length === 3) {
          const num = parseInt(parts[2]);
          if (!isNaN(num)) {
            setReturnNumber(`RET-${year}-${String(num + 1).padStart(3, "0")}`);
            return;
          }
        }
      }
      setReturnNumber(`RET-${year}-001`);
    } catch {
      const year = new Date().getFullYear();
      setReturnNumber(`RET-${year}-001`);
    }
  }, []);

  // ✅ Now useEffect safely calls already-declared callbacks
  useEffect(() => {
    fetchItems();
    fetchLastNumber();
    fetchReturns();
  }, [fetchItems, fetchLastNumber, fetchReturns]);

  useEffect(() => {
    setTotalItems(addedItems.length);
  }, [addedItems]);

  const getItemName = (id) => {
    const item = items.find((it) => it.id === id);
    return item ? `${item.itemBrand?.brandName || ""} - ${item.itemCode}` : "";
  };

  const resetForm = () => {
    setSelectedItem("");
    setQuantity("");
    setIsLoose(false);
    setQuantityLitres("");
    setQuantityMiliLitres("");
    setEditIndex(null);
  };

  const resetAll = () => {
    resetForm();
    setAddedItems([]);
    setTotalItems(0);
    fetchLastNumber();
  };

  const submitReturn = async () => {
    if (addedItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setSubmitting(true);
    const payload = {
      ronumber: returnNumber,
      createdAt: new Date().toISOString(),
      items: addedItems.map((it) => ({
        itemId: it.itemId,
        quantity: it.isLoose ? null : it.quantity,
        quantityLitres: it.isLoose ? it.quantityLitres : null,
        quantityMiliLitres: it.isLoose ? it.quantityMiliLitres : null,
        isLoose: it.isLoose,
      })),
    };
    try {
      await axios.post("http://localhost:8080/api/return", payload, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Return submitted successfully");
      resetAll();
      fetchReturns();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit return");
    }
    setSubmitting(false);
  };

  const itemColumns = [
    { title: "Item", dataIndex: "itemName", key: "itemName", width: 150 },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record) => (record.isLoose ? "-" : text || "-"),
      width: 120,
    },
    {
      title: "Quantity (Liters)",
      dataIndex: "quantityMiliLitres",
      key: "quantityLitres",
      render: (text, record) =>
        record.isLoose && text ? (text / 1000).toFixed(3) : "-",
      width: 120,
    },
    {
      title: "Is Loose",
      dataIndex: "isLoose",
      key: "isLoose",
      render: (v) => (v ? "Yes" : "No"),
      width: 120,
    },
  ];

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

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6 w-full py-4 px-6"
        style={{ background: 'linear-gradient(90deg, #D4D2D2 0%, #665E5E 100%)', color: '#515151' }}>
        {editingIndex !== null ? 'Update Return Item' : 'Return Items'}
      </h1>

      {mounted && <div className="space-y-4 flex flex-col w-[60%] bg-[#3D3B3B] px-8 py-8 rounded-lg">
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
                  paddingTop: 5
                }}
                disabled={isSubmitting}
              />
            </div>
          )}

          {isLoose && (
            <div className="flex flex-col w-full">
              <label className="mb-1 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Quantity In Litres</label>
              <InputNumber
                min={0.001}
                step={0.001}
                value={looseInLiters ? Number(looseInLiters) : null}
                onChange={(value) => setLooseInLiters(value)}
                formatter={(value) => value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
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
      </div>}

      {mounted && returnItems.length > 0 && (
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
                      {item.isLoose && item.quantityMiliLitres 
                        ? (item.quantityMiliLitres / 1000).toFixed(3) 
                        : '-'}
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
                  setSearchReturnNo('')
                  setSearchCreatedAt('')
                  setPage(1)
                  fetchPaginatedReturns(true)
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

      {mounted && <div className="mt-12">
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
            onChange: (p, s) => { setPage(p); setSize(s) },
          }}
          loading={searchLoading}
          onChange={(pagination, filters, sorter) => {
            if (sorter && sorter.field) {
              setSortBy(sorter.field)
              setSortDir(sorter.order === 'ascend' ? 'asc' : 'desc')
            }
          }}
          size="large"
          className="text-base"
          bordered
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </div>}
    </MainLayout>
  )
}
