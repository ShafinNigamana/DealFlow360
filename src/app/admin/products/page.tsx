'use client'

import React, { useEffect, useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { ProductDTO, CategoryDTO } from '@/types/api-contracts'
import { Plus, Package } from 'lucide-react'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // New Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [basePrice, setBasePrice] = useState(100)
  const [unit, setUnit] = useState('license')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')])
      if (pRes.ok) setProducts(await pRes.json())
      if (cRes.ok) {
        const cJson = await cRes.json()
        setCategories(cJson)
        if (cJson.length > 0) setCategoryId(cJson[0].id)
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateProduct = async () => {
    if (!name || !categoryId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          categoryId,
          basePrice: Number(basePrice),
          unit,
          description,
        }),
      })

      if (!res.ok) throw new Error('Failed to create product')
      setIsModalOpen(false)
      setName('')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <InternalShell title="Product & Price List Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Metric Cards Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Total Products</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
              {products.length}
            </div>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Product Categories</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
              {categories.length}
            </div>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Configured Pricelists</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4F46E5', marginTop: '4px' }}>
              Active (USD)
            </div>
          </Card>
        </div>

        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} /> Add Product
          </Button>
        </div>

        {/* Product Catalog Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Product Catalog & Base Pricing" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Loading product catalog...
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product Name</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Base Price</TableHeaderCell>
                  <TableHeaderCell>Unit</TableHeaderCell>
                  <TableHeaderCell>Variants</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((prod) => (
                  <TableRow key={prod.id}>
                    <TableCell style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} color="#4F46E5" />
                        {prod.name}
                      </div>
                    </TableCell>
                    <TableCell>{prod.category?.name || 'General'}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${Number(prod.basePrice).toFixed(2)}</TableCell>
                    <TableCell>{prod.unit}</TableCell>
                    <TableCell>{prod.variants?.length || 0} variants</TableCell>
                    <TableCell>
                      <Badge variant="success">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Add Product Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Product"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateProduct} isLoading={isSaving}>
                Save Product
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <Input
              label="Base Price ($)"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              required
            />
            <Input label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unit / user / seat" />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </Modal>
      </div>
    </InternalShell>
  )
}
