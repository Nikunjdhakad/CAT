import { z } from 'zod';

// Enum schemas
export const pricingModelSchema = z.enum(['per_plate', 'per_event', 'custom_package']);
export const verificationStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export const profileVisibilitySchema = z.enum(['public', 'private', 'pending']);

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City must not exceed 100 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(100, 'State must not exceed 100 characters'),
  zipCode: z.string().min(1, 'Zip code is required'),
});

// Service area schema
export const serviceAreaSchema = z.object({
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City must not exceed 100 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(100, 'State must not exceed 100 characters'),
});

// Business hours schema
export const timeSlotSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

export const businessHoursSchema = z.object({
  monday: timeSlotSchema.optional(),
  tuesday: timeSlotSchema.optional(),
  wednesday: timeSlotSchema.optional(),
  thursday: timeSlotSchema.optional(),
  friday: timeSlotSchema.optional(),
  saturday: timeSlotSchema.optional(),
  sunday: timeSlotSchema.optional(),
}).optional();

// Phone number validation (supports various formats)
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// Create vendor profile schema
export const createVendorProfileSchema = z.object({
  businessName: z.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must not exceed 100 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  contactPhone: z.string()
    .regex(phoneRegex, 'Invalid phone number format'),
  address: addressSchema,
  serviceAreas: z.array(serviceAreaSchema)
    .min(1, 'At least one service area is required')
    .max(20, 'Maximum 20 service areas allowed'),
  businessHours: businessHoursSchema,
  maxEventCapacity: z.number()
    .int('Max event capacity must be an integer')
    .positive('Max event capacity must be positive')
    .optional(),
  pricingModel: pricingModelSchema,
  baseEventPrice: z.number()
    .positive('Base event price must be positive')
    .optional(),
  customPricingDescription: z.string()
    .min(10, 'Custom pricing description must be at least 10 characters')
    .max(500, 'Custom pricing description must not exceed 500 characters')
    .optional(),
}).refine(
  (data) => {
    // If pricing model is per_event, baseEventPrice is required
    if (data.pricingModel === 'per_event') {
      return data.baseEventPrice !== undefined && data.baseEventPrice > 0;
    }
    return true;
  },
  {
    message: 'Base event price is required when pricing model is per_event',
    path: ['baseEventPrice'],
  }
).refine(
  (data) => {
    // If pricing model is custom_package, customPricingDescription is required
    if (data.pricingModel === 'custom_package') {
      return data.customPricingDescription !== undefined && data.customPricingDescription.length >= 10;
    }
    return true;
  },
  {
    message: 'Custom pricing description is required when pricing model is custom_package',
    path: ['customPricingDescription'],
  }
);

// Update vendor profile schema (all fields optional except those that shouldn't change)
export const updateVendorProfileSchema = z.object({
  businessName: z.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .optional(),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  contactPhone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),
  address: addressSchema.optional(),
  serviceAreas: z.array(serviceAreaSchema)
    .max(20, 'Maximum 20 service areas allowed')
    .optional(),
  businessHours: businessHoursSchema,
  maxEventCapacity: z.number()
    .int('Max event capacity must be an integer')
    .positive('Max event capacity must be positive')
    .optional(),
  pricingModel: pricingModelSchema.optional(),
  baseEventPrice: z.number()
    .positive('Base event price must be positive')
    .optional(),
  customPricingDescription: z.string()
    .min(10, 'Custom pricing description must be at least 10 characters')
    .max(500, 'Custom pricing description must not exceed 500 characters')
    .optional(),
  profileVisibility: z.enum(['public', 'private'])
    .optional(), // Vendors can only toggle between public and private, not pending
}).refine(
  (data) => {
    // If pricing model is being updated to per_event, baseEventPrice should be provided
    if (data.pricingModel === 'per_event' && data.baseEventPrice === undefined) {
      return false;
    }
    return true;
  },
  {
    message: 'Base event price is required when pricing model is per_event',
    path: ['baseEventPrice'],
  }
).refine(
  (data) => {
    // If pricing model is being updated to custom_package, customPricingDescription should be provided
    if (data.pricingModel === 'custom_package' && data.customPricingDescription === undefined) {
      return false;
    }
    return true;
  },
  {
    message: 'Custom pricing description is required when pricing model is custom_package',
    path: ['customPricingDescription'],
  }
);

// Image upload schema
export const uploadImageSchema = z.object({
  imageType: z.enum(['profile', 'logo']),
});

// Gallery image upload schema (no additional fields needed, just file validation)
export const uploadGalleryImageSchema = z.object({
  position: z.number()
    .int('Position must be an integer')
    .min(0, 'Position must be non-negative')
    .optional(),
});

// Service area operations
export const addServiceAreaSchema = z.object({
  serviceAreas: z.array(serviceAreaSchema)
    .min(1, 'At least one service area is required')
    .max(20, 'Maximum 20 service areas allowed'),
});

// Admin approval schema
export const approveVendorSchema = z.object({
  // No additional fields needed for approval
});

// Admin rejection schema
export const rejectVendorSchema = z.object({
  rejectionReason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
});

// Query parameter schemas
export const vendorListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  city: z.string().optional(),
  state: z.string().optional(),
  cuisineType: z.string().optional(), // Will be validated against cuisine type enum
  dietaryTag: z.string().optional(), // Will be validated against dietary tag enum
  search: z.string().min(2, 'Search query must be at least 2 characters').optional(),
});

// Type exports for TypeScript
export type PricingModel = z.infer<typeof pricingModelSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type ProfileVisibility = z.infer<typeof profileVisibilitySchema>;
export type Address = z.infer<typeof addressSchema>;
export type ServiceArea = z.infer<typeof serviceAreaSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type BusinessHours = z.infer<typeof businessHoursSchema>;
export type CreateVendorProfileInput = z.infer<typeof createVendorProfileSchema>;
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type UploadGalleryImageInput = z.infer<typeof uploadGalleryImageSchema>;
export type AddServiceAreaInput = z.infer<typeof addServiceAreaSchema>;
export type ApproveVendorInput = z.infer<typeof approveVendorSchema>;
export type RejectVendorInput = z.infer<typeof rejectVendorSchema>;
export type VendorListQuery = z.infer<typeof vendorListQuerySchema>;
