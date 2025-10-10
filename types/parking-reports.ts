export interface ParkingService {
  id: string;
  name: string;
  email: string | null;
  additionalEmails: string[];
  isActive: boolean;
  description?: string | null;
  contactName?: string | null;
  phone?: string | null;
}

export interface ReportFile {
  path: string;
  name: string;
  size: number;
  month: string;
  year: string;
  type: 'PREPAID' | 'POSTPAID' | 'UNKNOWN';
}

export interface SelectedReport {
  serviceId: string;
  serviceName: string;
  reports: ReportFile[];
}

export interface SendStatus {
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'sending' | 'success' | 'error';
  message?: string;
}

export interface ReportSendRequest {
  serviceId: string;
  serviceName: string;
  email: string | null;
  additionalEmails: string[];
  reports: {
    path: string;
    name: string;
    type: string;
  }[];
  year: string;
  month: string;
}

export interface ReportAvailabilityRequest {
  serviceIds: string[];
  year: string;
  month: string;
  type: 'PREPAID' | 'POSTPAID' | 'BOTH';
}

export interface ReportAvailabilityResponse {
  success: boolean;
  reports: Record<string, ReportFile[]>;
}

export interface ReportSendResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  error?: string;
}

// Nova interfejsi za email body tekstove
export interface EmailBodyTexts {
  prepaid: string;
  postpaid: string;
}

export const EMAIL_BODY_TEXTS: EmailBodyTexts = {
  prepaid: `
    <p>Poštovani,</p>
    
    <p>U prilogu se nalaze mesečni <strong>PREPAID</strong> izveštaji za vaš parking servis.</p>
    
    <p>Ovi izveštaji sadrže podatke o svim prepaid transakcijama, uključujući:</p>
    <ul>
      <li>Broj transakcija po danima</li>
      <li>Ukupan prihod od prepaid parkinga</li>
      <li>Statistiku korišćenja parking mesta</li>
    </ul>
    
    <p>Molimo pregledajte priložene fajlove i kontaktirajte nas ukoliko imate bilo kakvih pitanja ili nejasnoća.</p>
  `,
  postpaid: `
    <p>Poštovani,</p>
    
    <p>U prilogu se nalaze mesečni <strong>POSTPAID</strong> izveštaji za vaš parking servis.</p>
    
    <p>Ovi izveštaji sadrže podatke o svim postpaid transakcijama, uključujući:</p>
    <ul>
      <li>Fakturisane korisnike i njihove transakcije</li>
      <li>Ukupan iznos za naplatu</li>
      <li>Detaljnu specifikaciju po korisniku</li>
    </ul>
    
    <p>Molimo pregledajte priložene fajlove i kontaktirajte nas ukoliko imate bilo kakvih pitanja ili nejasnoća.</p>
  `
};