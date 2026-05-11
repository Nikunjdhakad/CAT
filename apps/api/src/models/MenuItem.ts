import mongoose, { Schema, Types } from "mongoose";

export const MENU_CATEGORIES = [
  "appetizer",
  "main_course",
  "dessert",
  "beverage",
  "side_dish"
] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export const CUISINE_TYPES = [
  "indian",
  "chinese",
  "italian",
  "continental",
  "mexican",
  "thai",
  "japanese",
  "mediterranean",
  "fusion",
  "other"
] as const;
export type CuisineType = (typeof CUISINE_TYPES)[number];

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "dairy_free",
  "nut_free",
  "halal",
  "kosher",
  "spicy"
] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export interface IMenuItem {
  vendorId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  cuisineType: CuisineType;
  dietaryTags: DietaryTag[];
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    vendorId: { 
      type: Schema.Types.ObjectId, 
      ref: "VendorProfile", 
      required: true 
    },
    name: { 
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
      minlength: 10,
      maxlength: 500
    },
    price: { 
      type: Number, 
      required: true,
      min: 0,
      validate: {
        validator: function(v: number) {
          // Validate up to 2 decimal places
          return /^\d+(\.\d{1,2})?$/.test(v.toString());
        },
        message: "Price must be a positive number with up to 2 decimal places"
      }
    },
    category: { 
      type: String, 
      enum: MENU_CATEGORIES, 
      required: true 
    },
    cuisineType: { 
      type: String, 
      enum: CUISINE_TYPES, 
      required: true 
    },
    dietaryTags: {
      type: [String],
      enum: DIETARY_TAGS,
      default: [],
      validate: {
        validator: function(v: string[]) {
          // Ensure all tags are valid
          return v.every(tag => DIETARY_TAGS.includes(tag as DietaryTag));
        },
        message: "Invalid dietary tag"
      }
    },
    imageUrl: { type: String },
    isAvailable: { 
      type: Boolean, 
      required: true, 
      default: true 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
MenuItemSchema.index({ vendorId: 1, isAvailable: 1 });
MenuItemSchema.index({ vendorId: 1, category: 1 });
MenuItemSchema.index({ vendorId: 1, cuisineType: 1 });
MenuItemSchema.index({ vendorId: 1, dietaryTags: 1 });
MenuItemSchema.index({ vendorId: 1, price: 1 });

export const MenuItem =
  mongoose.models.MenuItem ?? 
  mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
