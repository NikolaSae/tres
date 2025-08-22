// /lib/types/contract-status.ts

import { ContractStatus } from '@prisma/client'; // Uvoz Prisma enum-a

// Re-exportujemo Prisma enum radi lakšeg uvoza
export { ContractStatus };

/**
 * Vraća korisnički-prijateljsku labelu za status ugovora.
 * @param status - Status ugovora iz Prisma enum-a.
 * @returns String labela statusa.
 */
export function getContractStatusLabel(status: ContractStatus): string {
  switch (status) {
    case ContractStatus.ACTIVE:
      return 'Active';
    case ContractStatus.EXPIRED:
      return 'Expired';
    case ContractStatus.PENDING:
      return 'Pending';
    case ContractStatus.RENEWAL_IN_PROGRESS:
      return 'Renewal in Progress';
    default:
      // Trebalo bi pokriti sve slučajeve sa enumom, ali dodajemo fallback
      return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

/**
 * Vraća CSS klasu (Tailwind) za boju statusa ugovora.
 * Može se koristiti za vizuelno razlikovanje statusa.
 * @param status - Status ugovora iz Prisma enum-a.
 * @returns String sa Tailwind CSS klasom za boju teksta ili pozadine.
 */
export function getContractStatusColor(status: ContractStatus): string {
  switch (status) {
    case ContractStatus.ACTIVE:
      return 'text-green-700 bg-green-100'; // Primer: Zelena za aktivne
    case ContractStatus.EXPIRED:
      return 'text-red-700 bg-red-100';     // Primer: Crvena za istekle
    case ContractStatus.PENDING:
      return 'text-yellow-700 bg-yellow-100'; // Primer: Žuta za pending
    case ContractStatus.RENEWAL_IN_PROGRESS:
      return 'text-blue-700 bg-blue-100';  // Primer: Plava za obnovu u toku
    default:
      return 'text-gray-700 bg-gray-100';    // Podrazumevana siva
  }
}

// Možete dodati i druge utility funkcije ako je potrebno, npr.
// function isStatusActive(status: ContractStatus): boolean { ... }
// function isStatusExpired(status: ContractStatus): boolean { ... }