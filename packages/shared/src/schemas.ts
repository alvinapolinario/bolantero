import { z } from "zod";
import { DELIVERY_TYPES } from "./constants";
import { USER_ROLES } from "./roles";

export const phoneSchema = z
  .string()
  .regex(/^\+639\d{9}$/, "Use PH format +639XXXXXXXXX");

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80),
  role: z.enum(USER_ROLES),
});

export const addressSchema = z.object({
  label: z.string().min(1).max(40),
  line1: z.string().min(3).max(160),
  barangay: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  serviceAreaCode: z.enum(["tacurong", "lambayong", "isulan"]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isDefault: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  categorySlug: z.string().min(2),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional().nullable(),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.number().positive(),
  name: z.string(),
});

export const checkoutSchema = z.object({
  merchantId: z.string().uuid(),
  addressId: z.string().uuid(),
  deliveryType: z.enum(DELIVERY_TYPES),
  paymentMethod: z.enum(["cod", "online"]),
  scheduledFor: z.string().datetime().optional().nullable(),
  items: z.array(cartItemSchema).min(1),
  notes: z.string().max(300).optional(),
});

export const verificationSubmitSchema = z.object({
  idType: z.string().min(2).max(60),
  idNumber: z.string().min(3).max(60),
});
