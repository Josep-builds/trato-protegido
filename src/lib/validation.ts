import { z } from "zod";

export const dealInputSchema = z.object({
  item_name: z.string().trim().min(1, "Item name is required").max(100),
  item_price: z.coerce
    .number()
    .positive("Price must be greater than 0")
    .max(1_000_000, "Price is too large"),
});

export type DealInput = z.infer<typeof dealInputSchema>;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validatePhoto(file: File | null, label: string): string | null {
  if (!file || file.size === 0) return `${label} is required`;
  if (!file.type.startsWith("image/")) return `${label} must be an image`;
  if (file.size > MAX_PHOTO_BYTES) return `${label} must be under 5MB`;
  return null;
}
