// /lib/contracts/expiration-checker.ts

import { isPast, differenceInDays } from 'date-fns'; // Pretpostavljena utility funkcija za rad sa datumima
import { ContractStatus } from '@prisma/client'; // Prisma enum za status

/**
 * Proverava da li je ugovor istekao na osnovu datuma završetka i statusa.
 * Status "EXPIRED" u bazi je primaran indikator, ali provera datuma
 * je korisna za klijentsku logiku ili za sinhronizaciju statusa.
 * @param endDate - Datum završetka ugovora.
 * @param status - Trenutni status ugovora.
 * @returns True ako je ugovor istekao, inače False.
 */
export function isContractExpired(endDate: Date, status: ContractStatus): boolean {
  // Ako status eksplicitno kaže da je istekao, to je najjači indikator
  if (status === ContractStatus.EXPIRED) {
    return true;
  }
  // Ako status nije EXPIRED, ali je datum završetka u prošlosti, smatramo ga isteklim
  // Proveravamo samo ako status nije PENDING ili RENEWAL_IN_PROGRESS, jer ti statusi mogu
  // imati datum u prošlosti dok se proces ne završi.
  if (status === ContractStatus.ACTIVE && isPast(endDate)) {
       return true;
  }
  return false;
}

/**
 * Proverava da li ugovor ističe u narednom broju dana.
 * Slično funkciji u validators.ts, ali ovde je zaokružena utility funkcija.
 * @param endDate - Datum završetka ugovora.
 * @param daysThreshold - Broj dana unutar kojih se smatra da ugovor ističe.
 * @returns True ako ugovor ističe uskoro, inače False.
 */
export function isContractExpiringSoon(endDate: Date, daysThreshold: number = 30): boolean {
  const today = new Date();
  // Postavimo vreme na početak dana za preciznije poređenje samo datuma
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Kraj dana isteka za preciznije poređenje

  // Mora biti u budućnosti ili danas i unutar praga
  const timeDiff = end.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Zaokružujemo nagore da bi danas ili sutra bilo >= 0

  return daysDiff >= 0 && daysDiff <= daysThreshold;
}


/**
 * Kalkuliše broj dana do isteka ugovora (pozitivan broj)
 * ili broj dana od isteka (negativan broj).
 * @param endDate - Datum završetka ugovora.
 * @returns Broj dana do/od isteka.
 */
export function getDaysUntilOrSinceExpiration(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Početak dana

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Kraj dana

    // differenceInDays vraća negativan broj ako je prvi datum pre drugog
    // Dakle, differenceInDays(endDate, today) će biti:
    // Pozitivan ako je endDate u budućnosti
    // Negativan ako je endDate u prošlosti
    // 0 ako je danas
    return differenceInDays(end, today);
}

/**
 * Određuje status isteka ugovora na osnovu datuma završetka i praga.
 * Može biti koristan za bojenje ili prikazivanje poruka.
 * @param endDate - Datum završetka ugovora.
 * @param daysThreshold - Prag za "uskoro ističe".
 * @returns String koji opisuje status isteka ('Expired', 'Expiring Soon', 'Active').
 */
export function getExpirationStatus(endDate: Date, daysThreshold: number = 30): 'Expired' | 'Expiring Soon' | 'Active' {
    const days = getDaysUntilOrSinceExpiration(endDate);

    if (days < 0) {
        return 'Expired';
    } else if (days >= 0 && days <= daysThreshold) {
        return 'Expiring Soon';
    } else {
        return 'Active'; // Ili 'Not Expiring Soon'
    }
}