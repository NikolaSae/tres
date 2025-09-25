// lib/formatters.ts

/**
 * Formats a number as currency (USD by default).
 * @param amount - The number amount to format.
 * @param locale - The locale string (e.g., 'en-US', 'de-DE'). Defaults to 'en-US'.
 * @param currency - The currency code (e.g., 'USD', 'EUR'). Defaults to 'USD'.
 * @returns The formatted currency string.
 */
export function formatCurrency(
    amount: number,
    locale: string = 'en-US',
    currency: string = 'RSD'
  ): string {
    // Use the built-in Intl.NumberFormat for reliable localization
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      // Optional: control decimal places
      // minimumFractionDigits: 2,
      // maximumFractionDigits: 2,
    });
  
    return formatter.format(amount);
  }
  
  /**
   * Formats a number as a percentage.
   * @param value - The number amount to format (e.g., 0.75 for 75%).
   * @param locale - The locale string. Defaults to 'en-US'.
   * @param options - Optional Intl.NumberFormat options for percentage.
   * @returns The formatted percentage string.
   */
  export function formatPercentage(
    value: number,
    locale: string = 'en-US',
    options?: Intl.NumberFormatOptions
  ): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0, // Default to no decimals for simplicity
      maximumFractionDigits: 2, // Allow up to 2 decimals
      ...options,
    });
    // Intl.NumberFormat expects a value between 0 and 1 for percentage
    return formatter.format(value / 100); // Assuming input is 0-100 range percentage
  }
  
  /**
   * Formats a date string or Date object.
   * Uses date-fns for flexible formatting.
   * @param date - The date value (string or Date object).
   * @param dateFormat - The format string (e.g., 'yyyy-MM-dd', 'PPP'). Defaults to 'PPP'.
   * @returns The formatted date string.
   */
  // You might already use date-fns directly, but a wrapper can be useful
  // import { format } from 'date-fns';
  // export function formatDate(
  //   date: string | Date,
  //   dateFormat: string = 'PPP'
  // ): string {
  //   try {
  //     return format(new Date(date), dateFormat);
  //   } catch (error) {
  //     console.error("Error formatting date:", date, error);
  //     return 'Invalid Date';
  //   }
  // }
  
  
  // Add other formatters as needed (e.g., number formatting, time formatting)