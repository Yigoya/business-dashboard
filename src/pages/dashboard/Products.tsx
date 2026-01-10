import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, ImageIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import api, { API_URL_FILE, getErrorMessage } from '../../lib/axios';
import type { Product, ProductFilters } from '../../types';

// Form shape for create/update
interface ProductFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  condition: 'NEW' | 'USED';
  stockQuantity: number;
  minOrderQuantity: number;
  sku: string;
  isActive: boolean;
  specifications: string; // free text "k:v; k2:v2"
  serviceIds: number[]; // local selection, turned into serviceIdsJson on submit
  images: FileList; // multiple (managed via local state for previews)
}

// Helper to normalize list response (paged or array)
function extractItems<T = any>(data: any): { items: T[]; totalPages: number; totalElements: number } {
  if (!data) return { items: [], totalPages: 0, totalElements: 0 };
  if (Array.isArray(data)) return { items: data, totalPages: 1, totalElements: data.length };
  if (Array.isArray(data.content)) return { items: data.content, totalPages: data.totalPages ?? 1, totalElements: data.totalElements ?? data.content.length };
  if (Array.isArray(data.items)) return { items: data.items, totalPages: data.totalPages ?? 1, totalElements: data.totalElements ?? data.items.length };
  return { items: [], totalPages: 0, totalElements: 0 };
}

export default function Products() {
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptImages = (files: File[]) => {
    if (!files.length) return;
    setNewImages(prev => {
      const seen = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const next = [...prev];
      files.forEach(file => {
        if (next.length >= 10) return;
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key) && file.type.startsWith('image/')) {
          seen.add(key);
          next.push(file);
        }
      });
      return next;
    });
  };

  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
    active: undefined,
    serviceId: undefined,
    page: 0,
    size: 12,
    sortBy: 'price',
    sortDir: 'asc',
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      currency: 'ETB',
      condition: 'NEW',
      isActive: true,
      serviceIds: [],
      specifications: '',
    },
  });

  // Fetch admin services and build tree for categoryId 6 (Market)
  type AdminService = { serviceId: number; name: string; services?: AdminService[] };
  type AdminCategory = { categoryId: number; categoryName: string; services?: AdminService[] };
  const { data: adminServicesResp } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const res = await api.get('/admin/services');
      return res.data as AdminCategory[];
    },
  });
  const marketTree: AdminService[] = useMemo(() => {
    const cats = (adminServicesResp ?? []) as AdminCategory[];
    const market = cats.find(c => c.categoryId === 6);
    const walk = (nodes?: AdminService[]): AdminService[] =>
      (nodes ?? []).map(n => ({ serviceId: n.serviceId, name: n.name, services: walk(n.services) }));
    return market ? walk(market.services) : [];
  }, [adminServicesResp]);
  const flattenTree = (nodes: AdminService[], depth = 0): { id: number; name: string; depth: number; children: any[] }[] =>
    nodes.flatMap(n => [{ id: n.serviceId, name: n.name, depth, children: n.services ?? [] as AdminService[] }, ...flattenTree(n.services ?? [], depth + 1)]);

  // Fetch products list
  const { data: productsResp, isLoading } = useQuery({
    queryKey: ['products', selectedBusinessId, filters],
    queryFn: async () => {
      const params: any = { ...filters };
      // API expects these only when truthy
      const qs = new URLSearchParams();
      if (filters.search) qs.set('search', String(filters.search));
  if (filters.category) qs.set('category', String(filters.category));
      if (filters.minPrice != null) qs.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice != null) qs.set('maxPrice', String(filters.maxPrice));
      if (filters.inStock != null) qs.set('inStock', String(filters.inStock));
      if (filters.active != null) qs.set('active', String(filters.active));
      if (filters.serviceId != null) qs.set('serviceId', String(filters.serviceId));
      qs.set('page', String(filters.page ?? 0));
      qs.set('size', String(filters.size ?? 12));
      qs.set('sortBy', String(filters.sortBy ?? 'price'));
      qs.set('sortDir', String(filters.sortDir ?? 'asc'));

      const url = `/marketplace/businesses/${selectedBusinessId}/products?${qs.toString()}`;
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!selectedBusinessId,
  });
  const { items: products, totalPages, totalElements } = extractItems<Product>(productsResp);

  // Create product
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/marketplace/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Product created');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      return api.put(`/marketplace/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Product updated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setEditing(null);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/marketplace/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmit = (data: ProductFormData) => {
    if (!selectedBusinessId) return toast.error('Select a business first');
    // build multipart
    const fd = new FormData();
    fd.append('businessId', selectedBusinessId);
    fd.append('name', data.name);
    fd.append('description', data.description);
    fd.append('price', String(data.price));
    fd.append('currency', data.currency);
    fd.append('condition', data.condition);
    fd.append('stockQuantity', String(data.stockQuantity));
    fd.append('minOrderQuantity', String(data.minOrderQuantity));
    // Category is derived from admin categoryId 6 -> "Market"
    fd.append('category', 'Market');
    fd.append('sku', data.sku);
    fd.append('isActive', String(data.isActive));
    fd.append('specifications', data.specifications ?? '');
    fd.append('serviceIdsJson', JSON.stringify(data.serviceIds ?? []));
    const imgs = newImages;
    if (imgs && imgs.length > 0) imgs.forEach((f) => fd.append('images', f));

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const startCreate = () => {
    setEditing(null);
    reset({
      name: '', description: '', price: 0, currency: 'ETB', condition: 'NEW', stockQuantity: 0, minOrderQuantity: 1,
      sku: '', isActive: true, specifications: '', serviceIds: [], images: undefined as any,
    });
    setNewImages([]);
    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    let serviceIds: number[] = p.serviceIds ?? [];
    const anyP = p as any;
    if ((!serviceIds || serviceIds.length === 0) && typeof anyP?.serviceIdsJson === 'string') {
      try { serviceIds = JSON.parse(anyP.serviceIdsJson); } catch {}
    }
    reset({
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency ?? 'ETB',
      condition: (p as any).condition ?? 'NEW',
      stockQuantity: p.stockQuantity,
      minOrderQuantity: p.minOrderQuantity,
      sku: p.sku,
      isActive: p.isActive,
      specifications: p.specifications ?? '',
      serviceIds,
      images: undefined as any,
    });
    setNewImages([]);
    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this product?')) deleteMutation.mutate(id);
  };

  const canPrev = (filters.page ?? 0) > 0;
  const canNext = totalPages ? (filters.page ?? 0) < totalPages - 1 : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Manage your marketplace products, inventory, and pricing.</p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={filters.search ?? ''}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 0 }))}
                placeholder="Search by name or SKU"
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {/* Category text filter removed per request; marketplace category is fixed to Market */}
          <input
            type="number"
            value={filters.minPrice ?? ''}
            onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined, page: 0 }))}
            placeholder="Min Price"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            value={filters.maxPrice ?? ''}
            onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 0 }))}
            placeholder="Max Price"
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={!!filters.inStock} onChange={(e) => setFilters(f => ({ ...f, inStock: e.target.checked ? true : undefined, page: 0 }))} />
              In stock
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={!!filters.active} onChange={(e) => setFilters(f => ({ ...f, active: e.target.checked ? true : undefined, page: 0 }))} />
              Active
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="price">Sort by Price</option>
            <option value="createdAt">Sort by Created</option>
            <option value="name">Sort by Name</option>
          </select>
          <select
            value={filters.sortDir}
            onChange={(e) => setFilters(f => ({ ...f, sortDir: e.target.value as 'asc' | 'desc' }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
          <select
            value={filters.size}
            onChange={(e) => setFilters(f => ({ ...f, size: Number(e.target.value), page: 0 }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
            <option value={48}>48 / page</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
                <div className="relative h-40 bg-gray-50">
                  {p.images?.[0] ? (
                    <img src={`${API_URL_FILE}${p.images[0]}`} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${p.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{p.name}</h3>
                      <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{p.currency ?? 'ETB'} {p.price?.toFixed ? p.price.toFixed(2) : p.price}</div>
                      <div className="text-xs text-gray-500">Stock: {p.stockQuantity}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{p.description}</p>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">Total: {totalElements}</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!canPrev}
                  onClick={() => setFilters(f => ({ ...f, page: Math.max(0, (f.page ?? 0) - 1) }))}
                  className={`inline-flex items-center px-3 py-2 border rounded-lg ${canPrev ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </button>
                <div className="text-sm">
                  Page {(filters.page ?? 0) + 1} of {totalPages}
                </div>
                <button
                  disabled={!canNext}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 0) + 1 }))}
                  className={`inline-flex items-center px-3 py-2 border rounded-lg ${canNext ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => { setIsModalOpen(false); setEditing(null); }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Product' : 'Add Product'}</h3>
                <button type="button" onClick={() => setShowAdvanced(v => !v)} className="inline-flex items-center px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-sm">
                  {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />} Advanced
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditing(null); }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full border rounded-lg px-3 py-2" />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              {showAdvanced && (
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input {...register('sku')} className="w-full border rounded-lg px-3 py-2" />
                </div>
              )}
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input type="number" step="0.01" {...register('price', { required: 'Price is required', min: { value: 0, message: 'Must be ≥ 0' } })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  {...register('currency', { required: 'Currency is required' })}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                  defaultValue="ETB"
                >
                  <option value="ETB">ETB (Birr)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="KES">KES (Shilling)</option>
                  <option value="NGN">NGN (Naira)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select
                  {...register('condition', { required: 'Condition is required' })}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                </select>
              </div>
              {showAdvanced && (
                <>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                    <input type="number" {...register('stockQuantity', { min: { value: 0, message: 'Must be ≥ 0' } })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">Min Order Quantity</label>
                    <input type="number" {...register('minOrderQuantity', { min: { value: 1, message: 'Must be ≥ 1' } })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">Active</label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked {...register('isActive')} />
                      <span className="text-sm text-gray-600">Product is active</span>
                    </div>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={3} {...register('description', { required: 'Description is required' })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              {showAdvanced && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Specifications</label>
                  <textarea rows={2} placeholder="Color: White; Voltage: 220V" {...register('specifications')} className="w-full border rounded-lg px-3 py-2" />
                </div>
              )}
              {/* Market services hierarchical multi-select */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Categories</label>
                <div className="relative">
                  <details className="group">
                    <summary className="list-none flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <span className="text-sm text-gray-700">{(watch('serviceIds')?.length ?? 0) > 0 ? `${watch('serviceIds')!.length} selected` : 'Select categories'}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 max-h-56 overflow-auto border rounded-lg p-2 bg-white shadow-sm">
                      {marketTree.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2 py-1">No services found</div>
                      ) : (
                        marketTree.map((node) => (
                          <ServiceTree key={node.serviceId} node={node} value={watch('serviceIds') ?? []} onToggle={(id) => {
                            const current = new Set(watch('serviceIds') ?? []);
                            if (current.has(id)) current.delete(id); else current.add(id);
                            setValue('serviceIds', Array.from(current));
                          }} />
                        ))
                      )}
                    </div>
                  </details>
                </div>
                {(watch('serviceIds')?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {flattenTree(marketTree).filter(it => (watch('serviceIds') ?? []).includes(it.id)).map(it => (
                      <span key={it.id} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{it.name}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Images with previews */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    acceptImages(files);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <div
                  className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center hover:border-blue-300 hover:bg-blue-50"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    acceptImages(Array.from(event.dataTransfer?.files ?? []));
                  }}
                >
                  <p className="text-sm text-gray-600">
                    Drop product photos here or
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="ml-1 inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">Upload up to 10 images. The first preview becomes the cover.</p>
                  {newImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewImages([])}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                {newImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {newImages.map((file, idx) => (
                      <div key={idx} className="relative group border rounded-lg overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="h-24 w-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setNewImages(arr => arr.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/60 text-white opacity-0 group-hover:opacity-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!editing && newImages.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">You can upload multiple images. The first preview is used as cover.</p>
                )}
                {editing && (editing.images?.length ?? 0) > 0 && newImages.length === 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {editing.images!.map((img, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <img src={`${API_URL_FILE}${img}`} alt={`existing-${idx}`} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 sticky bottom-0 bg-white pt-4 pb-2 border-t flex justify-end gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditing(null); }} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Recursive tree component
function ServiceTree({ node, value, onToggle }: { node: { serviceId: number; name: string; services?: any[] }, value: number[], onToggle: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = (node.services?.length ?? 0) > 0;
  const checked = value.includes(node.serviceId);
  return (
    <div className="pl-2">
      <div className="flex items-center gap-2 py-1">
        {hasChildren && (
          <button type="button" onClick={() => setOpen(v => !v)} className="text-gray-500 hover:text-gray-700">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
        <input type="checkbox" checked={checked} onChange={() => onToggle(node.serviceId)} />
        <span className="text-sm text-gray-700">{node.name}</span>
      </div>
      {hasChildren && open && (
        <div className="pl-5 border-l ml-2">
          {node.services!.map((child: any) => (
            <ServiceTree key={child.serviceId} node={child} value={value} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
