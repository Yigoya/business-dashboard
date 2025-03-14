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
  Linkedin,
  Camera
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

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Business Profile</h2>
          <button
            onClick={() => {
              setIsEditing(false);
              reset();
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              {...register("name", { required: "Business name is required" })}
              defaultValue={business.name}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description", { required: "Description is required" })}
              defaultValue={business.description}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...register("phoneNumber", { required: "Phone number is required" })}
                defaultValue={business.phoneNumber}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                defaultValue={business.email}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              {...register("website")}
              defaultValue={business.website}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  {...register("location.street", { required: "Street is required" })}
                  defaultValue={business.location.street}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  {...register("location.city", { required: "City is required" })}
                  defaultValue={business.location.city}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  {...register("location.state", { required: "State is required" })}
                  defaultValue={business.location.state}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  {...register("location.postalCode", { required: "Postal code is required" })}
                  defaultValue={business.location.postalCode}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opening Hours</h3>
            {Object.entries(business.openingHours).map(([key, value]) => {
              const day = key.replace(/Open|Close/, '');
              const isOpen = key.includes('Open');
              return (
                <div key={key} className={`${isOpen ? 'mt-4' : 'mt-2'}`}>
                  {isOpen && (
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {day}
                    </label>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        {...register(`openingHours.${key}` as any)}
                        // value={value}
                        
                        type="time"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  {...register("socialMedia.facebook")}
                  defaultValue={business.socialMedia.facebook || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Facebook profile URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter
                </label>
                <input
                  {...register("socialMedia.twitter")}
                  defaultValue={business.socialMedia.twitter || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Twitter profile URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  {...register("socialMedia.instagram")}
                  defaultValue={business.socialMedia.instagram || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Instagram profile URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <input
                  {...register("socialMedia.linkedin")}
                  defaultValue={business.socialMedia.linkedin || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="LinkedIn profile URL"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
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
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h3>
            <div className="mt-4">
              <p className="text-base text-gray-900">
                {business.location.street}<br />
                {business.location.city}, {business.location.state} {business.location.postalCode}<br />
                {business.location.country}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Contact Information
            </h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-base text-gray-900">{business.phoneNumber}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-base text-gray-900">{business.email}</span>
              </div>
              {business.website && (
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-gray-400 mr-2" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:text-blue-800"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Opening Hours
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(business.openingHours).reduce((acc: any[], [key, value], index) => {
                if (key.includes('Open')) {
                  const day = key.replace('Open', '');
                  const closeTime = business.openingHours[`${day}Close` as keyof typeof business.openingHours];
                  acc.push(
                    <div key={day} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500 capitalize">{day}</span>
                      <span className="text-sm text-gray-900">
                        {value} - {closeTime}
                      </span>
                    </div>
                  );
                }
                return acc;
              }, [])}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Social Media
            </h3>
            <div className="mt-4 space-y-2">
              {business.socialMedia.facebook && (
                <div className="flex items-center">
                  <Facebook className="w-4 h-4 text-gray-400 mr-2" />
                  <a
                    href={business.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:text-blue-800"
                  >
                    Facebook
                  </a>
                </div>
              )}
              {business.socialMedia.twitter && (
                <div className="flex items-center">
                  <Twitter className="w-4 h-4 text-gray-400 mr-2" />
                  <a
                    href={business.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:text-blue-800"
                  >
                    Twitter
                  </a>
                </div>
              )}
              {business.socialMedia.instagram && (
                <div className="flex items-center">
                  <Instagram className="w-4 h-4 text-gray-400 mr-2" />
                  <a
                    href={business.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:text-blue-800"
                  >
                    Instagram
                  </a>
                </div>
              )}
              {business.socialMedia.linkedin && (
                <div className="flex items-center">
                  <Linkedin className="w-4 h-4 text-gray-400 mr-2" />
                  <a
                    href={business.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:text-blue-800"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}