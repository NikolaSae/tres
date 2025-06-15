// /utils/format.ts

// Funkcija za formatiranje broja kao valute
export function formatCurrency(amount: number | null | undefined, currency: string = 'EUR', locale: string = 'en-US'): string {
  // Proveravamo da li je vrednost validan broj
  const numericAmount = typeof amount === 'number' ? amount : 0;

  // Koristimo Intl.NumberFormat za robustno formatiranje valute
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      // Podesite broj decimala po potrebi
      minimumFractionDigits: 0,
      maximumFractionDigits: 2, 
    }).format(numericAmount);
  } catch (error) {
    console.error("Greška pri formatiranju valute:", error);
    // Fallback na jednostavan format u slučaju greške
    return `${numericAmount.toFixed(2)} ${currency}`;
  }
}

// Ako imate druge korisne funkcije, izvezite ih ovde
// export function formatDate(date: Date) { ... }