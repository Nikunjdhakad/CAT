import mongoose, { Schema, Types } from "mongoose";

export const PRICING_MODELS = ["per_plate", "per_event", "custom_package"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const VERIFICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const PROFILE_VISIBILITIES = ["public", "private", "pending"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

export interface IServiceArea {
  city: string;
  state: string;
}

export interface IGalleryImage {
  _id: Types.ObjectId;
  url: string;
  uploadedAt: Date;
  position: number;
}

export interface IBusinessHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IVendorProfile {
  userId: Types.ObjectId;
  businessName: string;
  description: string;
  contactPhone: string;
  address: IAddress;
  serviceAreas: IServiceArea[];
  profileImageUrl?: string;
  logoUrl?: string;
  galleryImages: IGalleryImage[];
  businessHours?: IBusinessHours;
  maxEventCapacity?: number;
  pricingModel: PricingModel;
  baseEventPrice?: number;
  customPricingDescription?: string;
  verificationStatus: VerificationStatus;
  profileVisibility: ProfileVisibility;
  rejectionReason?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceAreaSchema = new Schema<IServiceArea>(
  {
    city: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    state: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 2,
      maxlength: 100
    }
  },
  { _id: false }
);

const GalleryImageSchema = new Schema<IGalleryImage>({
  url: { type: String, required: true },
  uploadedAt: { type: Date, required: true, default: Date.now },
  position: { type: Number, required: true, default: 0 }
});

const BusinessHoursSchema = new Schema<IBusinessHours>(
  {
    monday: {
      open: { type: String },
      close: { type: String }
    },
    tuesday: {
      open: { type: String },
      close: { type: String }
    },
    wednesday: {
      open: { type: String },
      close: { type: String }
    },
    thursday: {
      open: { type: String },
      close: { type: String }
    },
    friday: {
      open: { type: String },
      close: { type: String }
    },
    saturday: {
      open: { type: String },
      close: { type: String }
    },
    sunday: {
      open: { type: String },
      close: { type: String }
    }
  },
  { _id: false }
);

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const VendorProfileSchema = new Schema<IVendorProfile>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true 
    },
    businessName: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    description: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 20,
      maxlength: 2000
    },
    contactPhone: { 
      type: String, 
      required: true, 
      trim: true,
      validate: {
        validator: function(v: string) {
          // Basic phone number validation pattern
          return /^[\d\s\-\+\(\)]+$/.test(v);
        },
        message: "Invalid phone number format"
      }
    },
    address: { 
      type: AddressSchema, 
      required: true 
    },
    serviceAreas: {
      type: [ServiceAreaSchema],
      default: [],
      validate: {
        validator: function(v: IServiceArea[]) {
          return v.length <= 20;
        },
        message: "Cannot have more than 20 service areas"
      }
    },
    profileImageUrl: { type: String },
    logoUrl: { type: String },
    galleryImages: {
      type: [GalleryImageSchema],
      default: [],
      validate: {
        validator: function(v: IGalleryImage[]) {
          return v.length <= 20;
        },
        message: "Cannot have more than 20 gallery images"
      }
    },
    businessHours: { type: BusinessHoursSchema },
    maxEventCapacity: { 
      type: Number,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Max event capacity must be a positive integer"
      }
    },
    pricingModel: { 
      type: String, 
      enum: PRICING_MODELS, 
      required: true 
    },
    baseEventPrice: { 
      type: Number,
      min: 0,
      validate: {
        validator: function(this: IVendorProfile, v?: number) {
          // baseEventPrice is required when pricingModel is per_event
          if (this.pricingModel === "per_event") {
            return v !== undefined && v > 0;
          }
          return true;
        },
        message: "Base event price is required and must be positive when pricing model is per_event"
      }
    },
    customPricingDescription: { 
      type: String,
      trim: true,
      validate: {
        validator: function(this: IVendorProfile, v?: string) {
          // customPricingDescription is required when pricingModel is custom_package
          if (this.pricingModel === "custom_package") {
            return v !== undefined && v.length > 0;
          }
          return true;
        },
        message: "Custom pricing description is required when pricing model is custom_package"
      }
    },
    verificationStatus: { 
      type: String, 
      enum: VERIFICATION_STATUSES, 
      required: true,
      default: "pending"
    },
    profileVisibility: { 
      type: String, 
      enum: PROFILE_VISIBILITIES, 
      required: true,
      default: "private"
    },
    rejectionReason: { type: String, trim: true },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for efficient queries
VendorProfileSchema.index({ userId: 1 });
VendorProfileSchema.index({ verificationStatus: 1, profileVisibility: 1 });
VendorProfileSchema.index({ "serviceAreas.city": 1, "serviceAreas.state": 1 });
VendorProfileSchema.index({ businessName: "text" });

export const VendorProfile =
  mongoose.models.VendorProfile ?? 
  mongoose.model<IVendorProfile>("VendorProfile", VendorProfileSchema);
