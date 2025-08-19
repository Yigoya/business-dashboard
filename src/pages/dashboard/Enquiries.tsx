import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MessageSquare, Mail, Phone } from 'lucide-react';
import api from '../../lib/axios';
import { Enquiry } from '../../types';

export default function Enquiries() {
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['enquiries', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/enquiries/business/${selectedBusinessId}`);
      return response.data.content as Enquiry[];
    },
  });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Enquiries</h2>
      </div>

      <div className="space-y-6">
        {enquiries?.map((enquiry, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {enquiry.name}
                  </h3>
                </div>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Mail className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {enquiry.email}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Phone className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {enquiry.phoneNumber}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-600 whitespace-pre-line">
                    {enquiry.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {enquiries?.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No enquiries</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't received any customer enquiries yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}