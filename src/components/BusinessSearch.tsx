import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '../lib/axios';
import { Business } from '../types';

interface BusinessSearchProps {
  onSelect: (business: Business) => void;
  excludeId?: number;
}

export default function BusinessSearch({ onSelect, excludeId }: BusinessSearchProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['business-search', search],
    queryFn: async () => {
      const response = await api.get('/businesses/search', {
        params: { query: search }
      });
      console.log(response.data)
      return response.data.content as Business[];
    },
    enabled: search.length > 2
  });

  const filteredBusinesses = businesses?.filter(b => b.id !== excludeId);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search businesses..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {isOpen && search.length > 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredBusinesses?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No businesses found</div>
          ) : (
            <ul>
              {filteredBusinesses?.map((business) => {
                const locationLabel = [business.location?.city, business.location?.state]
                  .filter(Boolean)
                  .join(', ') || 'Location not set';

                return (
                  <li
                    key={business.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      onSelect(business);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="font-medium text-gray-900">{business.name}</div>
                    <div className="text-sm text-gray-500">{locationLabel}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}