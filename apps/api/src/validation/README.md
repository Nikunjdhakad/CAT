# Validation Schemas

This directory contains Zod validation schemas for the Vendor Profile & Menu Management System.

## Files

### `vendor.ts`
Contains validation schemas for vendor profile operations:

#### Schemas
- **`createVendorProfileSchema`** - Validates vendor profile creation
  - Business name: 3-100 characters
  - Description: 20-2000 characters
  - Contact phone: Valid phone number format
  - Address: Complete address with city, state, zip
  - Service areas: 1-20 areas, each with city (2-100 chars) and state (2-100 chars)
  - Business hours: Optional, with time slots in HH:MM format
  - Max event capacity: Optional positive integer
  - Pricing model: `per_plate`, `per_event`, or `custom_package`
  - Conditional validation:
    - If `per_event`: requires `baseEventPrice` (positive number)
    - If `custom_package`: requires `customPricingDescription` (10-500 chars)

- **`updateVendorProfileSchema`** - Validates vendor profile updates
  - All fields optional
  - Same validation rules as creation
  - Profile visibility: Can only be `public` or `private` (vendors cannot set `pending`)

- **`uploadImageSchema`** - Validates image upload type
  - Image type: `profile` or `logo`

- **`uploadGalleryImageSchema`** - Validates gallery image uploads
  - Position: Optional non-negative integer

- **`addServiceAreaSchema`** - Validates service area additions
  - Service areas: 1-20 areas

- **`approveVendorSchema`** - Validates vendor approval (no fields)

- **`rejectVendorSchema`** - Validates vendor rejection
  - Rejection reason: 10-500 characters

- **`vendorListQuerySchema`** - Validates vendor listing query parameters
  - Page: Positive integer (default: 1)
  - Limit: Positive integer, max 100 (default: 20)
  - City: Optional string
  - State: Optional string
  - Cuisine type: Optional string
  - Dietary tag: Optional string
  - Search: Optional string, min 2 characters

#### Enums
- **`pricingModelSchema`**: `per_plate`, `per_event`, `custom_package`
- **`verificationStatusSchema`**: `pending`, `approved`, `rejected`
- **`profileVisibilitySchema`**: `public`, `private`, `pending`

### `menu.ts`
Contains validation schemas for menu item operations:

#### Schemas
- **`createMenuItemSchema`** - Validates menu item creation
  - Name: 3-100 characters
  - Description: 10-500 characters
  - Price: Positive number with max 2 decimal places
  - Category: One of the menu categories
  - Cuisine type: One of the cuisine types
  - Dietary tags: Array of dietary tags (no duplicates)
  - Image URL: Optional valid URL

- **`updateMenuItemSchema`** - Validates menu item updates
  - All fields optional
  - Same validation rules as creation
  - Is available: Optional boolean

- **`uploadMenuItemImageSchema`** - Validates menu item image uploads (no fields)

- **`menuListQuerySchema`** - Validates menu listing query parameters
  - Category: Optional menu category
  - Cuisine type: Optional cuisine type
  - Dietary tag: Optional dietary tag
  - Price min: Optional positive number
  - Price max: Optional positive number
  - Is available: Optional boolean
  - Validation: If both price min and max provided, min must be ≤ max

#### Enums
- **`menuCategorySchema`**: `appetizer`, `main_course`, `dessert`, `beverage`, `side_dish`
- **`cuisineTypeSchema`**: `indian`, `chinese`, `italian`, `continental`, `mexican`, `thai`, `japanese`, `mediterranean`, `fusion`, `other`
- **`dietaryTagSchema`**: `vegetarian`, `vegan`, `gluten_free`, `dairy_free`, `nut_free`, `halal`, `kosher`, `spicy`

## Usage

### In Route Handlers

```typescript
import { createVendorProfileSchema } from '../validation/vendor.js';

// Validate request body
const result = createVendorProfileSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({
    error: 'Validation failed',
    details: result.error.errors,
  });
}

// Use validated data
const validatedData = result.data;
```

### Type Inference

All schemas export TypeScript types:

```typescript
import type { CreateVendorProfileInput, MenuCategory } from '../validation/vendor.js';
import type { CreateMenuItemInput, DietaryTag } from '../validation/menu.js';
```

## Testing

All validation schemas have been tested for:
- ✓ Minimum/maximum length constraints
- ✓ Required field validation
- ✓ Enum value validation
- ✓ Conditional validation (pricing models)
- ✓ Array constraints (service areas, dietary tags)
- ✓ Numeric constraints (price decimals, positive numbers)
- ✓ Duplicate detection (dietary tags)
- ✓ Format validation (phone numbers, time slots, URLs)

## Requirements Coverage

These validation schemas implement validation for the following requirements:
- Requirements 1.3, 1.4, 1.5, 1.6 (Vendor profile validation)
- Requirements 2.2 (Profile update validation)
- Requirements 5.1, 5.2, 5.3, 5.4 (Menu item validation)
- Requirements 6.2, 6.4 (Dietary tag validation)
- Requirements 7.3 (Cuisine type validation)
- Requirements 9.5 (Pricing model validation)
- Requirements 10.2, 10.3 (Service area validation)
