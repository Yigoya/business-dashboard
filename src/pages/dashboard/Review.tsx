import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Star,
  MessageSquare,
  ThumbsUp,

  Flag,
  Archive,
  Download,

  TrendingUp
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/axios';
import { Review, ReviewStatus, ReviewMetrics } from '../../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Add type augmentation for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface FilterOptions {
  dateRange: 'all' | 'week' | 'month' | 'year';
  rating: number | 'all';
  status: ReviewStatus | 'all';
}

export default function Reviews() {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    rating: 'all',
    status: 'all',
  });
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [response, setResponse] = useState('');
  
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', selectedBusinessId, filters],
    queryFn: async () => {
      const response = await api.get(`/businesses/reviews/business/${selectedBusinessId}`, {
        params: filters,
      });
      return response.data.content as Review[];
    },
    
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['review-metrics', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/review-metrics`);
      return response.data as ReviewMetrics;
    },
    // enabled: !!selectedBusinessId,

    enabled: false,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: number; response: string }) => {
      return api.post(`/businesses/reviews/${reviewId}/respond`, { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-metrics'] });
      toast.success('Response added successfully');
      setIsResponseModalOpen(false);
      setSelectedReview(null);
      setResponse('');
    },
    onError: () => {
      toast.error('Failed to add response');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: number; status: ReviewStatus }) => {
      return api.put(`/businesses/reviews/${reviewId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review status updated');
    },
    onError: () => {
      toast.error('Failed to update review status');
    },
  });

  const handleExportExcel = () => {
    if (!reviews) return;

    const data = reviews.map(review => ({
      'Date': review.date ? 
        (() => {
          try {
            return format(new Date(review.date), 'PP');
          } catch (error) {
            return 'Invalid date';
          }
        })() : 'No date available',
      'Customer': review.name,
      'Rating': review.rating,
      'Comment': review.comment,
      'Sentiment': review.sentiment,
      'Status': review.status,
      'Response': review.response || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reviews');
    XLSX.writeFile(wb, 'reviews.xlsx');
  };

  const handleExportPDF = () => {
    if (!reviews) return;

    const doc = new jsPDF();
    const tableData = reviews.map(review => [
      review.date ? 
        (() => {
          try {
            return format(new Date(review.date), 'PP');
          } catch (error) {
            return 'Invalid date';
          }
        })() : 'No date available',
      review.name,
      review.rating.toString(),
      review.comment,
      review.status,
    ]);

    // Use the autoTable function directly
    autoTable(doc, {
      head: [['Date', 'Customer', 'Rating', 'Comment', 'Status']],
      body: tableData,
    });

    doc.save('reviews.pdf');
  };

  if (isLoadingReviews || isLoadingMetrics) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Star className="w-12 h-12 text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.averageRating ? metrics.averageRating.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <MessageSquare className="w-12 h-12 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.totalReviews ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="w-12 h-12 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Response Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.responseRate ? `${(metrics.responseRate * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <ThumbsUp className="w-12 h-12 text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Positive Sentiment</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.sentimentBreakdown?.positive ? `${(metrics.sentimentBreakdown.positive * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value as any })}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="RESPONDED">Responded</option>
                <option value="FLAGGED">Flagged</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-600">
                      {review.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{review.name}</h3>
                    <span className="ml-2 text-sm text-gray-500">
                      {review.date ? 
                        (() => {
                          try {
                            return format(new Date(review.date), 'PP');
                          } catch (error) {
                            return 'Invalid date';
                          }
                        })() : 'No date available'
                      }
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill={i < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-gray-600">{review.comment}</p>
                  
                  {review.images.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {review.response && (
                    <div className="mt-4 pl-4 border-l-4 border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Business Response:</p>
                      <p className="mt-1 text-gray-600">{review.response}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {review.responseDate ? 
                          (() => {
                            try {
                              return format(new Date(review.responseDate), 'PP');
                            } catch (error) {
                              return 'Invalid date';
                            }
                          })() : 'No date available'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!review.response && (
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setIsResponseModalOpen(true);
                    }}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Respond
                  </button>
                )}
                <button
                  onClick={() => updateStatusMutation.mutate({
                    reviewId: review.id,
                    status: 'FLAGGED'
                  })}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Flag className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({
                    reviewId: review.id,
                    status: 'ARCHIVED'
                  })}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Archive className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                review.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                review.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {review.sentiment}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                review.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                review.status === 'RESPONDED' ? 'bg-green-100 text-green-800' :
                review.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {review.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {isResponseModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Respond to Review
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Responding to {selectedReview.name}'s review:</p>
              <p className="mt-2 text-gray-600">{selectedReview.comment}</p>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              rows={4}
              placeholder="Type your response..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsResponseModalOpen(false);
                  setSelectedReview(null);
                  setResponse('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => respondMutation.mutate({
                  reviewId: selectedReview.id,
                  response,
                })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}