import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  FileText,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import api, { getErrorMessage } from '../../../lib/axios';
import { Quote, QuoteStatus, Service, Contract, B2BPartner, Business } from '../../../types';

interface QuoteFormData {
  contractId: number;
  partnerId: number;
  items: {
    serviceId: number;
    quantity: number;
    unitPrice: number;
  }[];
  validUntil: string;
  notes: string;
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

export default function Quotes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<QuoteFormData>();
  const watchContractId = watch('contractId');

  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ['quotes', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/quotes`);
      return response.data.content as Quote[];
    },
  });

  const { data: services } = useQuery({
    queryKey: ['services', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/services/business/${selectedBusinessId}`);
      return response.data.content as Service[];
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ['contracts', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/contracts`);
      return response.data.content as Contract[];
    },
  });

  // Fetch partners and partner requests for dropdown selection
  const { data: partnerData } = useQuery({
    queryKey: ['b2b-partners', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/partners`);
      return response.data as PartnerResponse;
    },
  });

  // Combine partners and active partner requests
  const allPartners = [
    ...(partnerData?.partners.content || []),
    ...(partnerData?.partnerRequests.content || []).filter(request => request.status === 'ACTIVE')
  ];

  // Fetch partner business details
  const { data: partnerBusinesses } = useQuery({
    queryKey: ['partner-businesses', allPartners],
    queryFn: async () => {
      if (!allPartners || allPartners.length === 0) return {};
      
      const partnerIds = allPartners.map(p => 
        p.requestingBusinessId || p.partnerBusinessId
      );
      const businesses: Record<number, Business> = {};
      
      await Promise.all(partnerIds.map(async (id) => {
        if (!id) return;
        try {
          const response = await api.get(`/businesses/${id}/details`);
          businesses[id] = response.data.business;
        } catch (error) {
          console.error(`Failed to fetch business ${id}`, error);
        }
      }));
      
      return businesses;
    },
    enabled: !!allPartners && allPartners.length > 0,
  });

  // Set partnerId automatically when contract is selected
  useEffect(() => {
    if (watchContractId && contracts) {
      const selectedContract = contracts.find(c => c.id === Number(watchContractId));
      if (selectedContract) {
        setValue('partnerId', selectedContract.partnerId);
      }
    }
  }, [watchContractId, contracts, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      return api.post(`/businesses/${selectedBusinessId}/quotes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      console.error('Failed to create quote', error);
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuoteFormData }) => {
      return api.put(`/businesses/quotes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote updated successfully');
      setIsModalOpen(false);
      setEditingQuote(null);
      reset();
    },
    onError: (error) => {
      console.error('Failed to update quote', error);
      toast.error(getErrorMessage(error));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: QuoteStatus }) => {
      return api.put(`/businesses/quotes/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote status updated');
    },
    onError: (error) => {
      console.error('Failed to update quote status', error);
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/businesses/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Helper function to get partner business name
  const getPartnerName = (partnerId: number) => {
    if (!partnerBusinesses) return `Partner #${partnerId}`;
    return partnerBusinesses[partnerId]?.name || `Partner #${partnerId}`;
  };

  // Helper function to get partner ID for the dropdown
  const getPartnerIdForDropdown = (partner: B2BPartner) => {
    return partner.requestingBusinessId || partner.partnerBusinessId;
  };

  // Helper function to get partner display name for the dropdown
  const getPartnerDisplayName = (partner: B2BPartner) => {
    const partnerId = getPartnerIdForDropdown(partner);
    const partnerName = getPartnerName(partnerId);
    const partnerType = partner.partnerType;
    const isRequest = !!partner.requestingBusinessId;
    
    return `${partnerName} (${partnerType})${isRequest ? ' - Incoming Request' : ''}`;
  };

  if (isLoadingQuotes) {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Quotes</h2>
        <button
          onClick={() => {
            setEditingQuote(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Quote
        </button>
      </div>

      {quotes && quotes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FileText className="w-10 h-10 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Quote #{quote.id}
                    </h3>
                    <p className="text-sm text-gray-500">{getPartnerName(quote.partnerId)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {quote.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => {
                          setEditingQuote(quote);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this quote?')) {
                            deleteMutation.mutate(quote.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {quote.status === 'DRAFT' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({
                        id: quote.id,
                        status: 'SENT'
                      })}
                      className="p-2 text-gray-400 hover:text-green-600"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {quote.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {services?.find(s => s.id === item.serviceId)?.name} x {item.quantity}
                        </span>
                        <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total</span>
                    <span className="text-lg font-semibold">${quote.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Valid until: {format(new Date(quote.validUntil), 'PP')}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                      quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      quote.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {quote.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You don't have any quotes yet. Click "New Quote" to create your first quote for a partner.
          </p>
        </div>
      )}

      {/* Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingQuote ? 'Edit Quote' : 'New Quote'}
            </h3>

            <form onSubmit={handleSubmit(editingQuote ? 
              (data) => updateMutation.mutate({ id: editingQuote.id, data }) :
              (data) => createMutation.mutate(data)
            )} className="space-y-4">
              <div>
                <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                <select
                  id="contractId"
                  {...register('contractId', { required: "Contract is required", valueAsNumber: true })}
                  defaultValue={editingQuote ? (editingQuote as any).contractId || "" : ""}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="">Select a contract</option>
                  {contracts?.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.title} - {getPartnerName(contract.partnerId)}
                    </option>
                  ))}
                </select>
                {errors.contractId && <span className="text-sm text-red-500">{errors.contractId.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner
                </label>
                <select
                  {...register("partnerId", { required: "Partner is required", valueAsNumber: true })}
                  defaultValue={editingQuote?.partnerId}
                  disabled={!!watchContractId} // Disable if contract is selected
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 disabled:bg-gray-100"
                >
                  <option value="">Select a partner</option>
                  {allPartners?.map((partner) => (
                    <option key={partner.id} value={getPartnerIdForDropdown(partner)}>
                      {getPartnerDisplayName(partner)}
                    </option>
                  ))}
                </select>
                {errors.partnerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.partnerId.message}</p>
                )}
                {watchContractId && (
                  <p className="mt-1 text-xs text-gray-500">Partner is automatically selected based on the contract</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items
                </label>
                <div className="space-y-4">
                  {services?.map((service) => (
                    <div key={service.id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600">
                          {service.name}
                        </label>
                      </div>
                      <input
                        {...register(`items.${service.id}.serviceId` as any)}
                        type="hidden"
                        value={service.id}
                      />
                      <input
                        {...register(`items.${service.id}.quantity` as any)}
                        type="number"
                        placeholder="Qty"
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                      />
                      <input
                        {...register(`items.${service.id}.unitPrice` as any)}
                        type="number"
                        step="0.01"
                        defaultValue={service.price}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  {...register("validUntil", { required: "Valid until date is required" })}
                  type="date"
                  defaultValue={editingQuote?.validUntil.split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.validUntil && (
                  <p className="mt-1 text-sm text-red-600">{errors.validUntil.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register("notes")}
                  defaultValue={editingQuote?.notes}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingQuote(null);
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
                  {editingQuote ? 'Update' : 'Create'} Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}