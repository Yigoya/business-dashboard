import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, MapPin, Clock, Globe, Camera } from 'lucide-react';
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
    telegram: string;
    whatsapp: string;
    linkedin?: string | null;
  };
  images: FileList;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const PRIMARY_COLOR = '#2b78ac';
const PRIMARY_HOVER = '#256b9c';
const PHONE_PREFIX = '+251';
const PHONE_DIGIT_LENGTH = 9;
const PHONE_PREFIX_DIGITS = PHONE_PREFIX.slice(1);
const DEFAULT_OPENING_HOURS: BusinessForm['openingHours'] = {
  mondayOpen: '09:00',
  mondayClose: '17:00',
  tuesdayOpen: '09:00',
  tuesdayClose: '17:00',
  wednesdayOpen: '09:00',
  wednesdayClose: '17:00',
  thursdayOpen: '09:00',
  thursdayClose: '17:00',
  fridayOpen: '09:00',
  fridayClose: '17:00',
  saturdayOpen: '09:00',
  saturdayClose: '17:00',
  sundayOpen: '09:00',
  sundayClose: '17:00',
};

const DEFAULT_SOCIAL_MEDIA: BusinessForm['socialMedia'] = {
  facebook: '',
  telegram: '',
  whatsapp: '',
};

const baseInputClass = 'mt-2 block w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2';
const errorRingClass = 'border-red-400 focus:ring-red-300 focus:border-red-400';
const primaryRingClass = 'border-gray-200 focus:ring-[#2b78ac] focus:border-[#2b78ac]';

export default function BusinessRegistration() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<BusinessForm>({
    defaultValues: {
      openingHours: DEFAULT_OPENING_HOURS,
      socialMedia: DEFAULT_SOCIAL_MEDIA,
      phoneNumber: PHONE_PREFIX,
    },
  });

  const buildControlClass = (hasError?: boolean, extraClasses = '') => [
    baseInputClass,
    hasError ? errorRingClass : primaryRingClass,
    extraClasses,
  ].filter(Boolean).join(' ');

  const steps = [
    { icon: Building2, label: 'Basic Info', helper: 'Upload imagery and describe your business' },
    { icon: MapPin, label: 'Location', helper: 'Confirm where customers can find you' },
    { icon: Clock, label: 'Hours', helper: 'Let people know when you are open' },
    { icon: Globe, label: 'Contact', helper: 'Share your contact and social details' },
  ];

  const progressPercentage = (step / steps.length) * 100;
  const images = watch('images');
  const phoneValue = watch('phoneNumber');

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue('location.latitude', Number(coords.latitude.toFixed(6)));
        setValue('location.longitude', Number(coords.longitude.toFixed(6)));
      },
      () => toast.error('Unable to retrieve your location.')
    );
  }, [setValue]);

  useEffect(() => {
    if (!images || images.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const nextUrls = Array.from(images).map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  useEffect(() => {
    if (!phoneValue) {
      setValue('phoneNumber', PHONE_PREFIX, { shouldValidate: false });
      return;
    }

    if (!phoneValue.startsWith(PHONE_PREFIX)) {
      const digitsOnly = phoneValue.replace(/\D/g, '');
      const withoutPrefix = digitsOnly.startsWith(PHONE_PREFIX_DIGITS)
        ? digitsOnly.slice(PHONE_PREFIX_DIGITS.length)
        : digitsOnly;
      const sanitized = withoutPrefix.slice(0, PHONE_DIGIT_LENGTH);
      setValue('phoneNumber', `${PHONE_PREFIX}${sanitized}`, { shouldValidate: false });
    }
  }, [phoneValue, setValue]);

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
      if (data.images?.length) {
        Array.from(data.images).forEach((file) => {
          formData.append('images', file);
        });
      }
      
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
          <div className="space-y-8">
            <section className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
              <header>
                <h3 className="text-lg font-semibold text-gray-900">Brand Presence</h3>
                <p className="mt-1 text-sm text-gray-500">Upload a business logo or hero image to help customers recognise you instantly.</p>
              </header>
              <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,_320px)_1fr]">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#2b78ac]/40 bg-[#2b78ac]/5 px-6 py-8 text-center">
                  <Camera className="h-12 w-12 text-[#2b78ac]" />
                  <p className="mt-4 text-sm font-medium text-gray-700">Drag & drop or click to upload</p>
                  <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#2b78ac] px-4 py-2 text-sm font-semibold text-[#2b78ac] transition hover:bg-[#2b78ac] hover:text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2b78ac]">
                    <span>Choose files</span>
                    <input
                      {...register('images')}
                      type="file"
                      multiple
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">PNG or JPG up to 10MB</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Preview</p>
                  {previewUrls.length === 0 ? (
                    <div className="mt-3 flex h-40 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500">
                      Uploaded images will appear here
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {previewUrls.map((url, index) => (
                        <div key={url} className="aspect-square overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                          <img
                            src={url}
                            alt={`Business preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
              <header>
                <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                <p className="mt-1 text-sm text-gray-500">Tell customers what makes your business unique.</p>
              </header>
              <div className="mt-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="business-name">
                    Business Name
                  </label>
                  <input
                    id="business-name"
                    {...register('name', { required: 'Business name is required' })}
                    type="text"
                    placeholder="e.g. Horizon Creative Studio"
                    className={buildControlClass(Boolean(errors.name))}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="business-description">
                    Description
                  </label>
                  <textarea
                    id="business-description"
                    {...register('description')}
                    placeholder="Briefly describe your services, specialties, or mission."
                    className={buildControlClass(false, 'min-h-[120px] resize-y leading-relaxed')}
                  />
                </div>
              </div>
            </section>
          </div>
        );

      case 2:
        return (
          <section className="space-y-8 rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
            <header>
              <h3 className="text-lg font-semibold text-gray-900">Business Location</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter the address customers should visit. We automatically capture GPS coordinates to improve map accuracy.
              </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="street-address">
                  Street Address
                </label>
                <input
                  id="street-address"
                  {...register('location.street')}
                  type="text"
                  placeholder="123 Market Street"
                  className={buildControlClass(Boolean(errors.location?.street))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  {...register('location.city')}
                  type="text"
                  placeholder="Accra"
                  className={buildControlClass(Boolean(errors.location?.city))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  {...register('location.country')}
                  type="text"
                  placeholder="Ghana"
                  className={buildControlClass(Boolean(errors.location?.country))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="location-name">
                  Location Nickname
                </label>
                <input
                  id="location-name"
                  {...register('location.name')}
                  type="text"
                  placeholder="Head Office, East Legon"
                  className={buildControlClass(Boolean(errors.location?.name))}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <p className="font-medium text-gray-700">Coordinates</p>
                  <p className="mt-1 text-xs text-gray-500">These are captured from your browser automatically. Adjust only if the location is off.</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor="latitude">
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        {...register('location.latitude', { valueAsNumber: true })}
                        type="number"
                        step="0.000001"
                        className={buildControlClass(Boolean(errors.location?.latitude), 'bg-white')}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor="longitude">
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        {...register('location.longitude', { valueAsNumber: true })}
                        type="number"
                        step="0.000001"
                        className={buildControlClass(Boolean(errors.location?.longitude), 'bg-white')}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 3:
        return (
          <section className="space-y-8 rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
            <header>
              <h3 className="text-lg font-semibold text-gray-900">Opening Hours</h3>
              <p className="mt-1 text-sm text-gray-500">
                Default hours are pre-filled for you. Adjust any day that has special opening times or set both fields to the same value for 24-hour service.
              </p>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
              {DAYS.map((day) => {
                const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
                return (
                  <div key={day} className="rounded-lg border border-gray-100 bg-white/70 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">{capitalizedDay}</p>
                      <span className="rounded-full bg-[#2b78ac]/10 px-3 py-1 text-xs font-medium text-[#2b78ac]">
                        Default: 09:00 - 17:00
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor={`${day}-open`}>
                          Opens
                        </label>
                        <input
                          id={`${day}-open`}
                          {...register(`openingHours.${day}Open` as const)}
                          type="time"
                          className={buildControlClass(false, 'bg-white')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor={`${day}-close`}>
                          Closes
                        </label>
                        <input
                          id={`${day}-close`}
                          {...register(`openingHours.${day}Close` as const)}
                          type="time"
                          className={buildControlClass(false, 'bg-white')}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 4:
        return (
          <div className="space-y-8">
            <section className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
              <header>
                <h3 className="text-lg font-semibold text-gray-900">Primary Contact</h3>
                <p className="mt-1 text-sm text-gray-500">Share the best ways for customers to get in touch with you.</p>
              </header>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="phone-number">
                    Phone Number
                  </label>
                  <input
                    id="phone-number"
                    {...register('phoneNumber', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+251\d{9}$/,
                        message: 'Phone number must start with +251 and include 9 digits',
                      },
                      onChange: (event) => {
                        const nextValue = event.target.value;
                        const digitsOnly = nextValue.replace(/\D/g, '');
                        const withoutPrefix = digitsOnly.startsWith(PHONE_PREFIX_DIGITS)
                          ? digitsOnly.slice(PHONE_PREFIX_DIGITS.length)
                          : digitsOnly;
                        const trimmed = withoutPrefix.slice(0, PHONE_DIGIT_LENGTH);
                        const composed = `${PHONE_PREFIX}${trimmed}`;
                        event.target.value = composed;
                        setValue('phoneNumber', composed, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      },
                    })}
                    type="tel"
                    placeholder="900000000"
                    inputMode="numeric"
                    maxLength={PHONE_PREFIX.length + PHONE_DIGIT_LENGTH}
                    onFocus={(event) => {
                      if (!event.target.value.startsWith(PHONE_PREFIX)) {
                        setValue('phoneNumber', PHONE_PREFIX, { shouldValidate: false });
                      }
                      // Place caret at end so user starts typing digits
                      requestAnimationFrame(() => {
                        const length = event.target.value.length;
                        event.target.setSelectionRange(length, length);
                      });
                    }}
                    className={buildControlClass(Boolean(errors.phoneNumber))}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="email-address">
                    Email Address
                  </label>
                  <input
                    id="email-address"
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                    type="email"
                    placeholder="hello@yourbusiness.com"
                    className={buildControlClass(Boolean(errors.email))}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="website-url">
                    Website
                  </label>
                  <input
                    id="website-url"
                    {...register('website', {
                      required: 'Website is required',
                      pattern: {
                        value: /^(https?:\/\/)([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i,
                        message: 'Enter a valid URL including https://',
                      },
                    })}
                    type="url"
                    placeholder="https://www.yourbusiness.com"
                    className={buildControlClass(Boolean(errors.website))}
                  />
                  {errors.website && (
                    <p className="mt-2 text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white/80 p-6 shadow-sm">
              <header>
                <h3 className="text-lg font-semibold text-gray-900">Social Channels</h3>
                <p className="mt-1 text-sm text-gray-500">Add the platforms where customers can reach you online.</p>
              </header>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="facebook">
                    Facebook
                  </label>
                  <input
                    id="facebook"
                    {...register('socialMedia.facebook')}
                    type="text"
                    placeholder="https://facebook.com/yourbusiness"
                    className={buildControlClass(Boolean(errors.socialMedia?.facebook))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="telegram">
                    Telegram
                  </label>
                  <input
                    id="telegram"
                    {...register('socialMedia.telegram')}
                    type="text"
                    placeholder="https://t.me/yourbusiness"
                    className={buildControlClass(Boolean(errors.socialMedia?.telegram))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="whatsapp">
                    WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    {...register('socialMedia.whatsapp')}
                    type="text"
                    placeholder="https://wa.me/233240000000"
                    className={buildControlClass(Boolean(errors.socialMedia?.whatsapp))}
                  />
                </div>
              </div>
            </section>
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
          <Building2 className="mx-auto h-12 w-12" style={{ color: PRIMARY_COLOR }} />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register Your Business
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Fill out the form below to get started
          </p>
        </div>

        <div className="mt-8">
          <div className="flex flex-col items-center gap-5">
            <div className="flex w-full max-w-xl items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progressPercentage}%`, backgroundColor: PRIMARY_COLOR, transition: 'width 200ms ease' }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500">Step {step} of {steps.length}</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-4">
              {steps.map((item, index) => {
                const isActive = step === index + 1;
                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => setStep(index + 1)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'border-[#2b78ac] bg-[#2b78ac]/10 text-[#2b78ac]'
                        : 'border-transparent bg-gray-100 text-gray-500 hover:border-[#2b78ac] hover:text-[#2b78ac]'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <p className="text-sm text-gray-500">{steps[step - 1]?.helper}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              {renderStep()}

              <div className="mt-6 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b78ac]"
                  >
                    Previous
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b78ac]"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = PRIMARY_HOVER;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = PRIMARY_COLOR;
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b78ac] disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = PRIMARY_HOVER;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = PRIMARY_COLOR;
                    }}
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