import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, MapPin, Clock, Globe, Phone, Mail, Camera } from 'lucide-react';
import api from '../lib/axios';
import useAuthStore  from '../store/authStore';

interface BusinessForm {
  name: string;
  description: string;
  categoryIds: number[];
  location: {
    name: string;
    latitude: number;
    longitude: number;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phoneNumber: string;
  email: string;
  website: string;
  openingHours: {
    mondayOpen: string;
    mondayClose: string;
    tuesdayOpen: string;
    tuesdayClose: string;
    wednesdayOpen: string;
    wednesdayClose: string;
    thursdayOpen: string;
    thursdayClose: string;
    fridayOpen: string;
    fridayClose: string;
    saturdayOpen: string;
    saturdayClose: string;
    sundayOpen: string;
    sundayClose: string;
  };
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string | null;
  };
  images: FileList;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BusinessRegistration() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BusinessForm>();

  const onSubmit = async (data: BusinessForm) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      console.log(data)
      // Append basic info
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('ownerId', user?.id.toString() || '');
      // formData.append('categoryIds', JSON.stringify([1, 2])); // Example categories
      
      // Append location
      formData.append('locationJson', JSON.stringify(data.location));
      
      // Append contact info
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('email', data.email);
      formData.append('website', data.website);
      
      // Append hours
      formData.append('openingHoursJson', JSON.stringify(data.openingHours));
      
      // Append social media
      formData.append('socialMediaJson', JSON.stringify(data.socialMedia));
      
      // Append images
      Array.from(data.images).forEach((file) => {
        formData.append('images', file);
      });
      
      await api.post('/businesses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Business created successfully!');
      navigate('/business/select');
    } catch (error) {
      console.error(error)
      toast.error('Failed to create business');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Logo/Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload files</span>
                      <input
                        {...register('images')}
                        type="file"
                        multiple
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                {...register('name', { required: 'Business name is required' })}
                type="text"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  {...register('location.street')}
                  type="text"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  {...register('location.city')}
                  type="text"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  {...register('location.state')}
                  type="text"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  {...register('location.postalCode')}
                  type="text"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  {...register('location.country')}
                  type="text"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location Name
                </label>
                <input
                  {...register('location.name')}
                  type="text"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  {...register('location.latitude')}
                  type="number"
                  step="0.000001"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  {...register('location.longitude')}
                  type="number"
                  step="0.000001"
                  className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {day.charAt(0).toUpperCase() + day.slice(1)} Opening Time
                  </label>
                  <input
                    {...register(`openingHours.${day}Open` as any)}
                    type="time"
                    className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {day.charAt(0).toUpperCase() + day.slice(1)} Closing Time
                  </label>
                  <input
                    {...register(`openingHours.${day}Close` as any)}
                    type="time"
                    className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                {...register('phoneNumber')}
                type="tel"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                {...register('website')}
                type="url"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Facebook
              </label>
              <input
                {...register('socialMedia.facebook')}
                type="text"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Twitter
              </label>
              <input
                {...register('socialMedia.twitter')}
                type="text"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Instagram
              </label>
              <input
                {...register('socialMedia.instagram')}
                type="text"
                className="mt-1 block w-full h-10 pl-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register Your Business
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Fill out the form below to get started
          </p>
        </div>

        <div className="mt-8">
          <div className="flex justify-center">
            <nav className="flex items-center space-x-4">
              {[
                { icon: Building2, label: 'Basic Info' },
                { icon: MapPin, label: 'Location' },
                { icon: Clock, label: 'Hours' },
                { icon: Globe, label: 'Contact' },
              ].map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => setStep(index + 1)}
                  className={`flex flex-col items-center space-y-1 ${
                    step === index + 1
                      ? 'text-indigo-600'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              {renderStep()}

              <div className="mt-6 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Previous
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Business'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}