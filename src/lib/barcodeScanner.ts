import { getSupabaseClient } from "./supabase/client";

/**
 * Search for a product by barcode in the database
 * @param barcode - The barcode string to search for
 * @returns Product ID if found, null if not found
 */
export async function lookupProductByBarcode(
  barcode: string
): Promise<number | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("product_id")
      .eq("barcode", barcode)
      .in("product_status", ["publish", "published"])
      .maybeSingle();

    if (error) {
      console.error("Error looking up barcode:", error);
      return null;
    }

    return data?.product_id || null;
  } catch (error) {
    console.error("Exception during barcode lookup:", error);
    return null;
  }
}

/**
 * Validate if a string is a valid barcode format
 * Supports EAN-13, EAN-8, UPC-A, UPC-E
 */
export function isValidBarcodeFormat(barcode: string): boolean {
  // Remove any whitespace
  const cleanBarcode = barcode.trim();

  // Check if it's all digits
  if (!/^\d+$/.test(cleanBarcode)) {
    return false;
  }

  // Valid lengths: 8 (EAN-8/UPC-E), 12 (UPC-A), 13 (EAN-13)
  const validLengths = [8, 12, 13];
  return validLengths.includes(cleanBarcode.length);
}
