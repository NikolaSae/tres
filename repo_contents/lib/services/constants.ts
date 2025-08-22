// /lib/services/constants.ts
// Definicija konstanti i enuma vezanih za servise i proizvode

// Uvozimo ServiceType enum direktno iz Prisma klijenta
import { ServiceType } from '@prisma/client';

// Izvozimo ServiceType enum za korišćenje u kodu (npr. u filterima, formama)
export { ServiceType };

// Primeri mapiranja ili lista dozvoljenih vrednosti ako je potrebno
// export const ServiceCategoryLabels: Record<ServiceType, string> = {
//     [ServiceType.VAS]: 'Value Added Service',
//     [ServiceType.BULK]: 'Bulk Service',
//     [ServiceType.HUMANITARIAN]: 'Humanitarian Service',
//     [ServiceType.PARKING]: 'Parking Service',
// };

// Možete dodati i druge konstante relevantne za servise/proizvode
// export const DEFAULT_SERVICE_LIMIT = 10;
// export const ALLOWED_CSV_MIME_TYPES = ['text/csv'];