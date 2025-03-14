import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Users,
  Building,
  Phone,
  Mail,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api, { getErrorMessage } from '../../../lib/axios';
import { B2BPartner, B2BPartnerType, B2BPartnerStatus, Business } from '../../../types';
import BusinessSearch from '../../../components/BusinessSearch';

interface PartnerFormData {
  partnerType: B2BPartnerType;
  creditLimit?: number;
  paymentTerms?: string;
}

interface PartnerResponse {
  partners: {
    content: B2BPartner[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
  };
  partnerRequests: {
    content: B2BPartner[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
  };
}

export default function Partners() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<B2BPartner | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [partnersPage, setPartnersPage] = useState(0);
  const [requestsPage, setRequestsPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'partners' | 'requests'>('partners');
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');
  const pageSize = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PartnerFormData>();

  const { data: partnerData, isLoading } = useQuery({
    queryKey: ['b2b-partners', selectedBusinessId, partnersPage, requestsPage],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/partners?partnersPage=${partnersPage}&requestsPage=${requestsPage}&size=${pageSize}`);
      return response.data as PartnerResponse;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData & { partnerBusinessId: number }) => {
      return api.post(`/businesses/${selectedBusinessId}/partners`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-partners'] });
      toast.success('Partner request sent successfully');
      setIsModalOpen(false);
      reset();
      setSelectedBusiness(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PartnerFormData> }) => {
      return api.put(`/businesses/partners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-partners'] });
      toast.success('Partner updated successfully');
      setIsModalOpen(false);
      setEditingPartner(null);
      reset();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: B2BPartnerStatus }) => {
      return api.put(`/businesses/partners/${id}/status?status=${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-partners'] });
      toast.success('Partner status updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/businesses/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-partners'] });
      toast.success('Partner removed successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = async (data: PartnerFormData) => {
    if (!selectedBusiness && !editingPartner) {
      toast.error('Please select a business partner');
      return;
    }

    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data });
    } else {
      createMutation.mutate({
        ...data,
        partnerBusinessId: selectedBusiness!.id
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const partners = partnerData?.partners.content || [];
  const partnerRequests = partnerData?.partnerRequests.content || [];
  const totalPartnersPages = partnerData?.partners.totalPages || 1;
  const totalRequestsPages = partnerData?.partnerRequests.totalPages || 1;

  const renderPartnerCard = (partner: B2BPartner, isRequest = false) => (
    <div
      key={partner.id}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Building className="w-10 h-10 text-blue-600" />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isRequest ? partner.requestingBusinessName : partner.partnerBusinessName}
            </h3>
            <p className="text-sm text-gray-500">{partner.partnerType}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isRequest && (
            <>
              <button
                onClick={() => {
                  setEditingPartner(partner);
                  setIsModalOpen(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-600"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove this partner?')) {
                    deleteMutation.mutate(partner.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center text-sm text-gray-500">
          <Mail className="w-4 h-4 mr-2" />
          <span>{isRequest ? partner.requestingBusinessEmail : partner.partnerBusinessEmail}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Phone className="w-4 h-4 mr-2" />
          <span>{isRequest ? partner.requestingBusinessPhone : partner.partnerBusinessPhone}</span>
        </div>
        <div className="flex items-start text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-2 mt-0.5" />
          <span>
            {isRequest && partner.requestingLocation ? (
              <>
                {partner.requestingLocation.street}, {partner.requestingLocation.city}, 
                {partner.requestingLocation.state && ` ${partner.requestingLocation.state},`} 
                {partner.requestingLocation.country}
              </>
            ) : partner.partnerLocation ? (
              <>
                {partner.partnerLocation.street}, {partner.partnerLocation.city}, 
                {partner.partnerLocation.state && ` ${partner.partnerLocation.state},`} 
                {partner.partnerLocation.country}
              </>
            ) : (
              'Location not available'
            )}
          </span>
        </div>
        {partner.creditLimit && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Credit Limit:</span>
            <span className="ml-2">${partner.creditLimit.toLocaleString()}</span>
          </div>
        )}
        {partner.paymentTerms && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Payment Terms:</span>
            <span className="ml-2">{partner.paymentTerms}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            partner.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            partner.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            partner.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}
        >
          {partner.status}
        </span>
        <div className="flex space-x-2">
          {isRequest && partner.status === 'PENDING' && (
            <>
              <button
                onClick={() => updateStatusMutation.mutate({
                  id: partner.id,
                  status: 'ACTIVE'
                })}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Accept partnership"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => updateStatusMutation.mutate({
                  id: partner.id,
                  status: 'TERMINATED'
                })}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Reject partnership"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </>
          )}
          {!isRequest && partner.status === 'ACTIVE' && (
            <button
              onClick={() => updateStatusMutation.mutate({
                id: partner.id,
                status: 'SUSPENDED'
              })}
              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
              title="Suspend partnership"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">B2B Partners</h2>
        <button
          onClick={() => {
            setEditingPartner(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Partner
        </button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('partners')}
            className={`py-2 px-1 -mb-px ${
              activeTab === 'partners'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Partners ({partnerData?.partners.totalElements || 0})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 -mb-px ${
              activeTab === 'requests'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Requests ({partnerData?.partnerRequests.totalElements || 0})
          </button>
        </div>
      </div>

      {activeTab === 'partners' && (
        <>
          {partners.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map(partner => renderPartnerCard(partner))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active partnerships</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any active business partnerships yet. Click "Add Partner" to send a partnership request.
              </p>
            </div>
          )}
          
          {totalPartnersPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPartnersPage(prev => Math.max(0, prev - 1))}
                  disabled={partnersPage === 0}
                  className={`p-2 rounded-full ${
                    partnersPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {partnersPage + 1} of {totalPartnersPages}
                </span>
                <button
                  onClick={() => setPartnersPage(prev => Math.min(totalPartnersPages - 1, prev + 1))}
                  disabled={partnersPage === totalPartnersPages - 1}
                  className={`p-2 rounded-full ${
                    partnersPage === totalPartnersPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {partnerRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partnerRequests.map(request => renderPartnerCard(request, true))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No partnership requests</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any pending partnership requests from other businesses.
              </p>
            </div>
          )}
          
          {totalRequestsPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRequestsPage(prev => Math.max(0, prev - 1))}
                  disabled={requestsPage === 0}
                  className={`p-2 rounded-full ${
                    requestsPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {requestsPage + 1} of {totalRequestsPages}
                </span>
                <button
                  onClick={() => setRequestsPage(prev => Math.min(totalRequestsPages - 1, prev + 1))}
                  disabled={requestsPage === totalRequestsPages - 1}
                  className={`p-2 rounded-full ${
                    requestsPage === totalRequestsPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!editingPartner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Business Partner
                  </label>
                  <BusinessSearch
                    onSelect={setSelectedBusiness}
                    excludeId={Number(selectedBusinessId)}
                  />
                  {selectedBusiness && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <div className="font-medium">{selectedBusiness.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedBusiness.location.city}, {selectedBusiness.location.state}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Type
                </label>
                <select
                  {...register("partnerType", { required: "Partner type is required" })}
                  defaultValue={editingPartner?.partnerType}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="SUPPLIER">Supplier</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="RESELLER">Reseller</option>
                  <option value="MANUFACTURER">Manufacturer</option>
                </select>
                {errors.partnerType && (
                  <p className="mt-1 text-sm text-red-600">{errors.partnerType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit
                </label>
                <input
                  {...register("creditLimit", { 
                    valueAsNumber: true,
                    min: { value: 0, message: "Credit limit must be positive" }
                  })}
                  type="number"
                  defaultValue={editingPartner?.creditLimit}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.creditLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  {...register("paymentTerms")}
                  defaultValue={editingPartner?.paymentTerms}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="e.g., Net 30"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPartner(null);
                    reset();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPartner ? 'Update' : 'Add'} Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}