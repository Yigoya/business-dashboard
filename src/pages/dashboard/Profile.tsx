import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Camera,
  Facebook,
  Send,
  MessageCircle,
  Linkedin,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import api, { API_URL_FILE, getErrorMessage } from '../../lib/axios';
import { Business, BusinessType, Location } from '../../types';
import useAuthStore from '../../store/authStore';

const emptyLocation: Location = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  kebele: '',
  name: '',
  type: null,
  parentLocationId: null,
  coordinates: null,
};

const BUSINESS_TYPES: BusinessType[] = ['B2B', 'SERVICE', 'RETAIL', 'MANUFACTURER', 'SUPPLIER', 'DISTRIBUTOR', 'SERVICE_PROVIDER', 'WHOLESALER', 'OTHER'];

const parseSecondaryCategories = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

type AdminServiceNode = {
  serviceId: number;
  name: string;
  services?: AdminServiceNode[];
};

type AdminServiceCategory = {
  categoryId: number;
  categoryName: string;
  services?: AdminServiceNode[];
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [newImages, setNewImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [expandedServiceIds, setExpandedServiceIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { register, handleSubmit, reset, formState: { errors }, setValue, getValues } = useForm<Business & { serviceIds?: number[] }>();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/details`);
      return response.data.business as Business;
    },
  });

  useEffect(() => {
    if (!business) return;
    const anyBusiness = business as any;
    let nextIds: number[] = [];
    if (Array.isArray(anyBusiness.serviceIds)) {
      nextIds = anyBusiness.serviceIds;
    }
    if (nextIds.length === 0 && typeof anyBusiness.serviceIdsJson === 'string') {
      try {
        const parsed = JSON.parse(anyBusiness.serviceIdsJson);
        if (Array.isArray(parsed)) nextIds = parsed.filter((id: unknown) => typeof id === 'number');
      } catch (error) {
        console.warn('Unable to parse serviceIdsJson', error);
      }
    }
    if (nextIds.length === 0 && Array.isArray(business.categoryIds)) {
      nextIds = business.categoryIds;
    }
    setSelectedServiceIds(nextIds);
    setValue('serviceIds' as any, nextIds, { shouldDirty: false, shouldValidate: false });
  }, [business, setValue]);

  const { data: adminServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await api.get('/admin/services', { headers });
      return response.data as AdminServiceCategory[];
    },
  });

  const yellowPageTree = useMemo<AdminServiceNode[]>(() => {
    const categories = Array.isArray(adminServices) ? adminServices : [];
    const yellowPage = categories.find((category) => category.categoryId === 2);
    const clone = (nodes?: AdminServiceNode[]): AdminServiceNode[] =>
      (nodes ?? []).map((node) => ({ ...node, services: clone(node.services) }));
    return yellowPage ? clone(yellowPage.services) : [];
  }, [adminServices]);

  const serviceNameMap = useMemo(() => {
    const map = new Map<number, string>();
    const walk = (nodes?: AdminServiceNode[]) => {
      (nodes ?? []).forEach((node) => {
        map.set(node.serviceId, node.name);
        walk(node.services);
      });
    };
    walk(yellowPageTree);
    return map;
  }, [yellowPageTree]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.put(`/businesses/${selectedBusinessId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Business profile updated successfully');
      setIsEditing(false);
      setNewImages(null);
      setPreviewUrls([]);
    },
    onError: (error) => {
      console.log(error)
      toast.error(getErrorMessage(error));
    },
  });

  const toggleServiceSelection = (serviceId: number) => {
    setSelectedServiceIds((prev) => {
      const exists = prev.includes(serviceId);
      const next = exists ? prev.filter((id) => id !== serviceId) : [...prev, serviceId];
      setValue('serviceIds' as any, next, { shouldDirty: true, shouldValidate: false });
      return next;
    });
  };

  const toggleNodeExpansion = (serviceId: number) => {
    setExpandedServiceIds((prev) => (
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    ));
  };

  const renderServiceTree = (nodes: AdminServiceNode[], depth = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const hasChildren = Array.isArray(node.services) && node.services.length > 0;
      const isExpanded = expandedServiceIds.includes(node.serviceId);
      const isChecked = selectedServiceIds.includes(node.serviceId);

      return (
        <div key={node.serviceId} className={`mt-2 ${depth > 0 ? 'ml-4' : ''}`}>
          <div className="flex items-start gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNodeExpansion(node.serviceId)}
                className="mt-1 rounded text-gray-500 transition hover:text-blue-600"
                aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="mt-1 inline-flex h-4 w-4" />
            )}

            <label className="flex flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleServiceSelection(node.serviceId)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{node.name}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-6 border-l border-gray-200 pl-4">
              {renderServiceTree(node.services ?? [], depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
    setNewImages(null);
    setPreviewUrls([]);
  };

  const onSubmit = async (data: Business) => {
    const formData = new FormData();
    
    // Append basic info
    formData.append('name', data.name);
    if (data.nameAmharic) {
      formData.append('nameAmharic', data.nameAmharic);
    }
    formData.append('description', data.description);
    formData.append('businessType', (data.businessType as string) || 'OTHER');
    if (data.foundedYear !== undefined && data.foundedYear !== null && !Number.isNaN(data.foundedYear)) {
      formData.append('foundedYear', String(data.foundedYear));
    }
    if (data.employeeCount !== undefined && data.employeeCount !== null && !Number.isNaN(data.employeeCount)) {
      formData.append('employeeCount', String(data.employeeCount));
    }
    if (data.registrationNumber) {
      formData.append('registrationNumber', data.registrationNumber);
    }
    if (data.taxId) {
      formData.append('taxId', data.taxId);
    }
    if (data.legalRepresentativeName) {
      formData.append('legalRepresentativeName', data.legalRepresentativeName);
    }
    if (data.primaryCategory) {
      formData.append('primaryCategory', data.primaryCategory);
    }
    const secondaryCategories = parseSecondaryCategories((data as any).secondaryCategories ?? (data as any).secondaryCategoriesInput);
    formData.append('secondaryCategories', JSON.stringify(secondaryCategories));
    formData.append('localDistributionNetwork', String(Boolean(data.localDistributionNetwork)));
    formData.append('isVerified', String(Boolean(data.isVerified)));
    formData.append('isFeatured', String(Boolean(data.isFeatured)));
    const ownerId = business?.ownerId ?? data.ownerId;
    if (ownerId != null) {
      formData.append('ownerId', ownerId.toString());
    }
    const servicesPayload = (data as any).serviceIds ?? selectedServiceIds ?? [];
    formData.append('serviceIdsJson', JSON.stringify(servicesPayload));
    // formData.append('categoryIdsJson', JSON.stringify(data.categoryIds || []));
    // Append location
    const locationPayload = {
      ...emptyLocation,
      ...(business?.location ?? {}),
      ...(data.location ?? {}),
    };
    formData.append('locationJson', JSON.stringify(locationPayload));
    
    // Append contact info
    formData.append('phoneNumber', data.phoneNumber);
    if (data.alternativeContactPhone) {
      formData.append('alternativeContactPhone', data.alternativeContactPhone);
    }
    formData.append('email', data.email);
    formData.append('website', data.website || '');
    
    // Append hours and social media
    const openingHoursPayload = (data as any).openingHours ?? business?.openingHours ?? {};
    formData.append('openingHoursJson', JSON.stringify(openingHoursPayload));
    const socialMediaPayload = (data as any).socialMedia ?? business?.socialMedia ?? {};
    formData.append('socialMediaJson', JSON.stringify(socialMediaPayload));

    if (newImages && newImages.length > 0) {
      Array.from(newImages).forEach((file) => {
        formData.append('images', file);
      });
    }

  updateMutation.mutate(formData);
  };

  useEffect(() => {
    if (!newImages || newImages.length === 0) {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      return;
    }
    const urls = Array.from(newImages).map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No business found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a business to view its profile.
        </p>
      </div>
    );
  }

  const location = business.location ?? emptyLocation;
  const galleryImages = Array.from(new Set([...(business.images ?? []), ...((business as any).gallery ?? [])]));

  // Helper for opening hours rendering in edit mode
  const days: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'> = [
    'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
  ];

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Business Profile</h2>
              <p className="text-sm text-gray-500 mt-1">Update your company information and contact details.</p>
            </div>
            <button
              onClick={handleCancelEdit}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    {...register('name', { required: 'Business name is required' })}
                    defaultValue={business.name}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name (Amharic)</label>
                  <input
                    {...register('nameAmharic')}
                    defaultValue={business.nameAmharic ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    defaultValue={business.description}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <select
                    {...register('businessType', { required: 'Business type is required' })}
                    defaultValue={business.businessType ?? 'OTHER'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.businessType && <p className="mt-1 text-sm text-red-600">{errors.businessType.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Category</label>
                  <input
                    {...register('primaryCategory')}
                    defaultValue={business.primaryCategory ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    {...register('foundedYear', { valueAsNumber: true })}
                    defaultValue={business.foundedYear ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    {...register('employeeCount', { valueAsNumber: true })}
                    defaultValue={business.employeeCount ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    {...register('registrationNumber')}
                    defaultValue={business.registrationNumber ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID <span className="text-red-500">*</span></label>
                  <input
                    {...register('taxId', { required: 'Tax ID is required' })}
                    defaultValue={business.taxId ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Representative</label>
                  <input
                    {...register('legalRepresentativeName')}
                    defaultValue={business.legalRepresentativeName ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Categories</label>
                  <input
                    {...register('secondaryCategories' as any)}
                    defaultValue={(business.secondaryCategories ?? []).join(', ')}
                    placeholder="Textiles, Packaging"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple categories with commas.</p>
                </div>

                <div className="sm:col-span-2 flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('localDistributionNetwork')} defaultChecked={business.localDistributionNetwork ?? false} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Local distribution network
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('isVerified')} defaultChecked={business.isVerified} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Verified business
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('isFeatured')} defaultChecked={business.isFeatured} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Featured listing
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Images</label>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Current</p>
                      {Array.isArray(business.images) && business.images.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-3">
                          {business.images.map((image) => (
                            <div key={image} className="h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                              <img
                                src={`${API_URL_FILE}${image}`}
                                alt="Business gallery"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">No images uploaded yet.</p>
                      )}
                    </div>
                    {previewUrls.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New Uploads</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {previewUrls.map((url) => (
                            <div key={url} className="h-20 w-20 overflow-hidden rounded-lg border border-blue-200 bg-blue-50">
                              <img src={url} alt="New upload preview" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition cursor-pointer">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Images
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          setNewImages(event.target.files && event.target.files.length > 0 ? event.target.files : null);
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500">Upload JPG or PNG files up to 5MB each.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    {...register('phoneNumber', { required: 'Phone number is required' })}
                    defaultValue={business.phoneNumber}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Contact</label>
                  <input
                    {...register('alternativeContactPhone')}
                    defaultValue={business.alternativeContactPhone ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                    })}
                    defaultValue={business.email}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    {...register('website')}
                    defaultValue={business.website}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Categories (Yellow Page) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Categories</h3>

                </div>
                <span className="text-xs text-gray-500">{selectedServiceIds.length} selected</span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-72 overflow-auto">
                {isLoadingServices ? (
                  <p className="text-sm text-gray-500">Loading services...</p>
                ) : yellowPageTree.length === 0 ? (
                  <p className="text-sm text-gray-500">No services found for Yellow Page.</p>
                ) : (
                  renderServiceTree(yellowPageTree)
                )}
              </div>
              {selectedServiceIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedServiceIds.map((id) => (
                    <span key={id} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {serviceNameMap.get(id) ?? `ID ${id}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    {...register('location.street', { required: 'Street is required' })}
                    defaultValue={location.street}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    {...register('location.city', { required: 'City is required' })}
                    defaultValue={location.city}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    {...register('location.state')}
                    defaultValue={location.state}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    {...register('location.postalCode')}
                    defaultValue={location.postalCode}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    {...register('location.country')}
                    defaultValue={location.country}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kebele (optional)</label>
                  <input
                    {...register('location.kebele')}
                    defaultValue={location.kebele ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Opening Hours
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    // Copy current Monday values from form state to Tuesday-Friday
                    const mondayOpen = getValues('openingHours.mondayOpen' as any);
                    const mondayClose = getValues('openingHours.mondayClose' as any);
                    if (mondayOpen && mondayClose) {
                      (['tuesday', 'wednesday', 'thursday', 'friday'] as const).forEach((day) => {
                        setValue(`openingHours.${day}Open` as any, mondayOpen, { shouldDirty: true, shouldValidate: true });
                        setValue(`openingHours.${day}Close` as any, mondayClose, { shouldDirty: true, shouldValidate: true });
                      });
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Weekdays
                </button>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-medium text-gray-600 border-b border-gray-200 pb-2">
                <div>Day</div>
                <div>Opens</div>
                <div>Closes</div>
                <div className="text-center">Closed</div>
              </div>

              {/* Table Rows */}
              <div className="space-y-1">
                {days.map((day) => {
                  const isWeekend = day === 'saturday' || day === 'sunday';
                  return (
                    <div key={day} className={`grid grid-cols-4 gap-2 items-center py-2 px-2 rounded ${
                      isWeekend ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}>
                      <div className={`text-sm font-medium capitalize ${
                        isWeekend ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {day.slice(0, 3)}
                      </div>

                      <input
                        type="time"
                        defaultValue={(business.openingHours as any)?.[`${day}Open`]}
                        {...register(`openingHours.${day}Open` as any)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />

                      <input
                        type="time"
                        defaultValue={(business.openingHours as any)?.[`${day}Close`]}
                        {...register(`openingHours.${day}Close` as any)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />

                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          id={`${day}-closed`}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          onChange={(e) => {
                            const openField = document.querySelector(`input[name="openingHours.${day}Open"]`) as HTMLInputElement;
                            const closeField = document.querySelector(`input[name="openingHours.${day}Close"]`) as HTMLInputElement;
                            if (e.target.checked) {
                              if (openField) openField.value = '';
                              if (closeField) closeField.value = '';
                              if (openField) openField.disabled = true;
                              if (closeField) closeField.disabled = true;
                            } else {
                              if (openField) openField.disabled = false;
                              if (closeField) closeField.disabled = false;
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <div className="flex items-start gap-2">
                  <svg className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-yellow-800 leading-tight">
                    Check "Closed" for days when your business is not open. Use "Copy to Weekdays" to quickly set the same hours for Tuesday-Friday.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Social Media
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </label>
                  <input
                    {...register('socialMedia.facebook')}
                    defaultValue={business.socialMedia.facebook || ''}
                    placeholder="Facebook profile URL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#229ED9]" />
                    Telegram
                  </label>
                  <input
                    {...register('socialMedia.telegram')}
                    defaultValue={business.socialMedia.telegram || ''}
                    placeholder="Telegram channel or handle"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    WhatsApp
                  </label>
                  <input
                    {...register('socialMedia.whatsapp')}
                    defaultValue={business.socialMedia.whatsapp || ''}
                    placeholder="WhatsApp link (wa.me)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </label>
                  <input
                    {...register('socialMedia.linkedin')}
                    defaultValue={business.socialMedia.linkedin || ''}
                    placeholder="LinkedIn profile URL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{business.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {business.isVerified && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">Verified</span>
                )}
                {business.isFeatured && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">Featured</span>
                )}
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {[location.city, location.state].filter(Boolean).join(', ') || 'Location not set'}
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Business Name</h4>
                <p className="mt-1 text-base text-gray-900">{business.name}</p>
              </div>
              {business.nameAmharic && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Business Name (Amharic)</h4>
                  <p className="mt-1 text-base text-gray-900">{business.nameAmharic}</p>
                </div>
              )}
              {business.businessType && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Business Type</h4>
                  <p className="mt-1 text-base text-gray-900">{business.businessType}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-base text-gray-900">{business.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {business.foundedYear && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Founded Year</h4>
                    <p className="mt-1 text-base text-gray-900">{business.foundedYear}</p>
                  </div>
                )}
                {business.employeeCount !== null && business.employeeCount !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Employees</h4>
                    <p className="mt-1 text-base text-gray-900">{business.employeeCount}</p>
                  </div>
                )}
                {business.registrationNumber && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Registration Number</h4>
                    <p className="mt-1 text-base text-gray-900">{business.registrationNumber}</p>
                  </div>
                )}
                {business.taxId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tax ID</h4>
                    <p className="mt-1 text-base text-gray-900">{business.taxId}</p>
                  </div>
                )}
                {business.legalRepresentativeName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Legal Representative</h4>
                    <p className="mt-1 text-base text-gray-900">{business.legalRepresentativeName}</p>
                  </div>
                )}
                {business.primaryCategory && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Primary Category</h4>
                    <p className="mt-1 text-base text-gray-900">{business.primaryCategory}</p>
                  </div>
                )}
                {Array.isArray(business.secondaryCategories) && business.secondaryCategories.length > 0 && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Secondary Categories</h4>
                    <p className="mt-1 text-base text-gray-900">{business.secondaryCategories.join(', ')}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Local Distribution Network</h4>
                  <p className="mt-1 text-base text-gray-900">{business.localDistributionNetwork ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1 text-base text-gray-900">
                  {location.street || 'Street not set'}<br />
                  {[location.kebele ? `Kebele ${location.kebele}` : null, location.city, location.state].filter(Boolean).join(', ') || 'City/State not set'} {location.postalCode || ''}<br />
                  {location.country || 'Country not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Media Gallery
            </h3>
            {galleryImages.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((image) => (
                  <div key={image} className="group relative overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <img
                      src={`${API_URL_FILE}${image}`}
                      alt="Business gallery item"
                      className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 group-hover:opacity-100 transition" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white/80 backdrop-blur-sm rounded px-2 py-1">
                      Asset
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No images uploaded yet.</p>
            )}
          </div>

          {/* Opening Hours */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Opening Hours
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Safely render opening hours; backend may return null/undefined */}
              {(() => {
                const openingHours = (business.openingHours ?? {}) as Record<string, string>;
                const entries = Object.entries(openingHours);
                if (!entries.length) {
                  return (
                    <p className="text-sm text-gray-500 col-span-1 sm:col-span-2">No opening hours set.</p>
                  );
                }
                return entries.reduce((acc: any[], [key, value]) => {
                  if (key.endsWith('Open')) {
                    const day = key.replace('Open', '');
                    const closeTime = openingHours[`${day}Close`] || '—';
                    const openTime = value || '—';
                    acc.push(
                      <div key={day} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                        <span className="text-sm font-medium text-gray-600 capitalize">{day}</span>
                        <span className="text-sm text-gray-900">{openTime} - {closeTime}</span>
                      </div>
                    );
                  }
                  return acc;
                }, []);
              })()}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Contact Information
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{business.phoneNumber}</span>
                </div>
                <a className="text-xs text-blue-600 hover:underline" href={`tel:${business.phoneNumber}`}>Call</a>
              </div>
              {business.alternativeContactPhone && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{business.alternativeContactPhone}</span>
                  </div>
                  <a className="text-xs text-blue-600 hover:underline" href={`tel:${business.alternativeContactPhone}`}>Call</a>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{business.email}</span>
                </div>
                <a className="text-xs text-blue-600 hover:underline" href={`mailto:${business.email}`}>Email</a>
              </div>
              {business.website && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 text-gray-400 mr-2" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {business.website}
                    </a>
                  </div>
                  <span className="text-xs text-gray-400">Website</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Social Media
            </h3>
            <div className="mt-4 space-y-2">
              {business.socialMedia.facebook && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Facebook className="w-4 h-4 text-[#1877F2] mr-2" />
                    <a href={business.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">Facebook</a>
                  </div>
                  <span className="text-xs text-gray-400">Profile</span>
                </div>
              )}
              {business.socialMedia.telegram && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Send className="w-4 h-4 text-[#229ED9] mr-2" />
                    <a href={business.socialMedia.telegram} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">Telegram</a>
                  </div>
                  <span className="text-xs text-gray-400">Profile</span>
                </div>
              )}
              {business.socialMedia.whatsapp && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 text-[#25D366] mr-2" />
                    <a href={business.socialMedia.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">WhatsApp</a>
                  </div>
                  <span className="text-xs text-gray-400">Profile</span>
                </div>
              )}
              {business.socialMedia.linkedin && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Linkedin className="w-4 h-4 text-[#0A66C2] mr-2" />
                    <a href={business.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">LinkedIn</a>
                  </div>
                  <span className="text-xs text-gray-400">Profile</span>
                </div>
              )}
              {!business.socialMedia.facebook && !business.socialMedia.telegram && !business.socialMedia.whatsapp && !business.socialMedia.linkedin && (
                <p className="text-sm text-gray-500">No social profiles linked.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}