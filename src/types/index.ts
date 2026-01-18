export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  profileImage: string | null;
  language: string;
}

export type BusinessType =
  | 'B2B'
  | 'SERVICE'
  | 'RETAIL'
  | 'MANUFACTURER'
  | 'SUPPLIER'
  | 'DISTRIBUTOR'
  | 'SERVICE_PROVIDER'
  | 'WHOLESALER'
  | 'OTHER';

export interface Business {
  id: number;
  name: string;
  nameAmharic?: string | null;
  businessType?: BusinessType | null;
  description: string;
  ownerId: number;
  foundedYear?: number | null;
  employeeCount?: number | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  legalRepresentativeName?: string | null;
  primaryCategory?: string | null;
  secondaryCategories?: string[];
  localDistributionNetwork?: boolean;
  alternativeContactPhone?: string | null;
  categoryIds: number[];
  serviceIds?: number[];
  serviceIdsJson?: string;
  location: Location | null;
  phoneNumber: string;
  email: string;
  website: string;
  openingHours: OpeningHours;
  socialMedia: SocialMedia;
  images: string[];
  isVerified: boolean;
  isFeatured: boolean;
  parentBusinessId?: number;
  childBusinesses?: Business[];
}

export interface Location {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  kebele?: string;
  name: string;
  type: string | null;
  parentLocationId: number | null;
  coordinates: Coordinates | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
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
}

export interface SocialMedia {
  facebook: string | null;
  telegram: string | null;
  whatsapp: string | null;
  linkedin: string | null;
}

export interface Service {
  id: number;
  name: string;
  businessId: number;
  categoryId: number;
  description: string;
  price: number;
  image: string | null;
  available: boolean;
  options: ServiceOption[];
  volumePricing?: VolumePricing[];
}

export interface ServiceOption {
  name: string;
  price: number;
  description: string;
}

export interface VolumePricing {
  minQuantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  businessId: number;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  serviceLocation: Location;
  paymentMethod: PaymentMethod;
  scheduledDate: string;
  createdAt: string;
  updatedAt: string;
  specialInstructions: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  isB2B?: boolean;
  contractId?: number;
  quoteId?: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: number;
  serviceId: number;
  serviceName: string;
  serviceDescription: string;
  serviceBasePrice: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedOptions: Record<string, string>;
  notes: string;
}

export interface PaymentMethod {
  id: number;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  paymentType: string;
  isDefault: boolean;
}

export interface Promotion {
  id?: number;
  businessId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: string;
  discountPercentage: number;
  image?: File | string;
}

export interface Enquiry {
  businessId: number;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
}

export interface Review {
  id: number;
  businessId: number;
  userId: number;
  name: string;
  rating: number;
  comment: string;
  images: string[];
  date: string;
  sentiment?: ReviewSentiment;
  responseDate?: string;
  response?: string;
  status: ReviewStatus;
}

export type ReviewSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type ReviewStatus = 'PENDING' | 'RESPONDED' | 'FLAGGED' | 'ARCHIVED';

export interface ReviewResponse {
  id: number;
  reviewId: number;
  businessId: number;
  response: string;
  date: string;
}

export interface ReviewMetrics {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface Contract {
  id: number;
  businessId: number;
  partnerId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  terms: string;
  status: ContractStatus;
  documents: string[];
}

export type ContractStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface Quote {
  id: number;
  businessId: number;
  partnerId: number;
  items: QuoteItem[];
  validUntil: string;
  status: QuoteStatus;
  notes: string;
  total: number;
}

export interface QuoteItem {
  serviceId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface B2BPartner {
  id: number;
  businessId: number;
  partnerBusinessId: number;
  partnerBusinessName: string;
  partnerBusinessEmail: string;
  partnerBusinessPhone: string;
  partnerLocation: Location;
  requestingBusinessId?: number;
  requestingBusinessName?: string;
  requestingBusinessEmail?: string;
  requestingBusinessPhone?: string;
  requestingLocation?: Location;
  partnerType: B2BPartnerType;
  status: B2BPartnerStatus;
  creditLimit?: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export type B2BPartnerType = 'SUPPLIER' | 'DISTRIBUTOR' | 'RESELLER' | 'MANUFACTURER';
export type B2BPartnerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface UserRole {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

// Marketplace Product Types
export interface Product {
  id: number;
  businessId: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  condition?: 'NEW' | 'USED';
  stockQuantity: number;
  minOrderQuantity: number;
  category: string;
  sku: string;
  isActive: boolean;
  specifications: string; // semi-colon separated key:value pairs e.g. "Color: White; Voltage: 220V"
  serviceIds: number[]; // derived from serviceIdsJson
  images: string[]; // file names or URLs returned by API
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  active?: boolean;
  serviceId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}