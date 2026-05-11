import { z } from 'zod';

// Enum schemas
export const menuCategorySchema = z.enum([
  'appetizer',
  'main_course',
  'dessert',
  'beverage',
  'side_dish',
]);

export const cuisineTypeSchema = z.enum([
  'indian',
  'chinese',
  'italian',
  'continental',
  'mexican',
  'thai',
  'japanese',
  'mediterranean',
  'fusion',
  'other',
]);

export const dietaryTagSchema = z.enum([
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'halal',
  'kosher',
  'spicy',
]);

// Create menu item schema
export const createMenuItemSchema = z.object({
  name: z.string()
    .min(3, 'Menu item name must be at least 3 characters')
    .max(100, 'Menu item name must not exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  price: z.number()
    .positive('Price must be positive')
    .refine(
      (val) => {
        // Check if the number has at most 2 decimal places
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      {
        message: 'Price must have at most 2 decimal places',
      }
    ),
  category: menuCategorySchema,
  cuisineType: cuisineTypeSchema,
  dietaryTags: z.array(dietaryTagSchema)
    .default([])
    .refine(
      (tags) => {
        // Ensure no duplicate tags
        return new Set(tags).size === tags.length;
      },
      {
        message: 'Dietary tags must be unique',
      }
    ),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

// Update menu item schema (all fields optional)
export const updateMenuItemSchema = z.object({
  name: z.string()
    .min(3, 'Menu item name must be at least 3 characters')
    .max(100, 'Menu item name must not exceed 100 characters')
    .optional(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  price: z.number()
    .positive('Price must be positive')
    .refine(
      (val) => {
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      {
        message: 'Price must have at most 2 decimal places',
      }
    )
    .optional(),
  category: menuCategorySchema.optional(),
  cuisineType: cuisineTypeSchema.optional(),
  dietaryTags: z.array(dietaryTagSchema)
    .refine(
      (tags) => {
        return new Set(tags).size === tags.length;
      },
      {
        message: 'Dietary tags must be unique',
      }
    )
    .optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isAvailable: z.boolean().optional(),
});

// Menu item image upload schema
export const uploadMenuItemImageSchema = z.object({
  // No additional fields needed, just file validation in middleware
});

// Query parameter schemas for menu filtering
export const menuListQuerySchema = z.object({
  category: menuCategorySchema.optional(),
  cuisineType: cuisineTypeSchema.optional(),
  dietaryTag: dietaryTagSchema.optional(),
  priceMin: z.coerce.number().positive('Minimum price must be positive').optional(),
  priceMax: z.coerce.number().positive('Maximum price must be positive').optional(),
  isAvailable: z.coerce.boolean().optional(),
}).refine(
  (data) => {
    // If both priceMin and priceMax are provided, ensure priceMin <= priceMax
    if (data.priceMin !== undefined && data.priceMax !== undefined) {
      return data.priceMin <= data.priceMax;
    }
    return true;
  },
  {
    message: 'Minimum price must be less than or equal to maximum price',
    path: ['priceMin'],
  }
);

// Type exports for TypeScript
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type CuisineType = z.infer<typeof cuisineTypeSchema>;
export type DietaryTag = z.infer<typeof dietaryTagSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type UploadMenuItemImageInput = z.infer<typeof uploadMenuItemImageSchema>;
export type MenuListQuery = z.infer<typeof menuListQuerySchema>;
