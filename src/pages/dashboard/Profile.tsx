import { useState } from 'react';
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
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/axios';
import { Business } from '../../types';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Business>();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/details`);
      return response.data.business as Business;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.put(`/businesses/${selectedBusinessId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Business profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      console.log(error)
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = async (data: Business) => {
  console.log({ ...business?.location, ...data.location})
    const formData = new FormData();
    
    // Append basic info
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('ownerId', business!.ownerId.toString());
    // formData.append('categoryIdsJson', JSON.stringify(data.categoryIds || []));
    // Append location
    formData.append('locationJson', JSON.stringify({ ...business?.location, ...data.location}));
    
    // Append contact info
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('email', data.email);
    formData.append('website', data.website || '');
    
    // Append hours and social media
    formData.append('openingHoursJson', JSON.stringify(data.openingHours));
    formData.append('socialMediaJson', JSON.stringify(data.socialMedia));

  updateMutation.mutate(formData);
  };

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
              onClick={() => { setIsEditing(false); reset(); }}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Basic Info */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    {...register('name', { required: 'Business name is required' })}
                    defaultValue={business.name}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    defaultValue={business.description}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    {...register('phoneNumber', { required: 'Phone number is required' })}
                    defaultValue={business.phoneNumber}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    {...register('website')}
                    defaultValue={business.website}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <input
                    {...register('location.street', { required: 'Street is required' })}
                    defaultValue={business.location.street}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    {...register('location.city', { required: 'City is required' })}
                    defaultValue={business.location.city}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    {...register('location.state', { required: 'State is required' })}
                    defaultValue={business.location.state}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    {...register('location.postalCode', { required: 'Postal code is required' })}
                    defaultValue={business.location.postalCode}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Opening Hours */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opening Hours</h3>
              <div className="grid grid-cols-1 gap-4">
                {days.map((day) => (
                  <div key={day} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 capitalize">{day}</label>
                    <input
                      type="time"
                      defaultValue={(business.openingHours as any)[`${day}Open`]}
                      {...register(`openingHours.${day}Open` as any)}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      defaultValue={(business.openingHours as any)[`${day}Close`]}
                      {...register(`openingHours.${day}Close` as any)}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Social Media */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    {...register('socialMedia.facebook')}
                    defaultValue={business.socialMedia.facebook || ''}
                    placeholder="Facebook profile URL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input
                    {...register('socialMedia.twitter')}
                    defaultValue={business.socialMedia.twitter || ''}
                    placeholder="Twitter profile URL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    {...register('socialMedia.instagram')}
                    defaultValue={business.socialMedia.instagram || ''}
                    placeholder="Instagram profile URL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input
                    {...register('socialMedia.linkedin')}
                    defaultValue={business.socialMedia.linkedin || ''}
                    placeholder="LinkedIn profile URL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsEditing(false); reset(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600">
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
                  {business.location.city}, {business.location.state}
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
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-base text-gray-900">{business.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1 text-base text-gray-900">
                  {business.location.street}<br />
                  {business.location.city}, {business.location.state} {business.location.postalCode}<br />
                  {business.location.country}
                </p>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Opening Hours
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(business.openingHours).reduce((acc: any[], [key, value]) => {
                if (key.includes('Open')) {
                  const day = key.replace('Open', '');
                  const closeTime = (business.openingHours as any)[`${day}Close`];
                  acc.push(
                    <div key={day} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <span className="text-sm font-medium text-gray-600 capitalize">{day}</span>
                      <span className="text-sm text-gray-900">{value} - {closeTime}</span>
                    </div>
                  );
                }
                return acc;
              }, [])}
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
              {business.socialMedia.twitter && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Twitter className="w-4 h-4 text-[#1DA1F2] mr-2" />
                    <a href={business.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">Twitter</a>
                  </div>
                  <span className="text-xs text-gray-400">Profile</span>
                </div>
              )}
              {business.socialMedia.instagram && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center">
                    <Instagram className="w-4 h-4 text-[#E4405F] mr-2" />
                    <a href={business.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">Instagram</a>
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
              {!business.socialMedia.facebook && !business.socialMedia.twitter && !business.socialMedia.instagram && !business.socialMedia.linkedin && (
                <p className="text-sm text-gray-500">No social profiles linked.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}