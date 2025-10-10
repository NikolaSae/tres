//lib/email-templates/parking-report-email.ts

interface ParkingReportEmailProps {
  serviceName: string;
  monthName: string;
  year: string;
  reports: Array<{
    name: string;
    type: string;
  }>;
  attachmentCount: number;
  reportType?: 'PREPAID' | 'POSTPAID'; // Opciono - detektuj automatski ako nije prosleđen
  customBodyText?: string; // Opcioni custom tekst
}

export function generateParkingReportEmail({
  serviceName,
  monthName,
  year,
  reports,
  attachmentCount,
  reportType,
  customBodyText,
}: ParkingReportEmailProps): string {
  // Podrazumevani body tekstovi
  const defaultBodyTexts = {
    PREPAID: `
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
    POSTPAID: `
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

  // Koristi custom tekst ako je prosleđen, inače koristi podrazumevani
  const bodyText = customBodyText || defaultBodyTexts[reportType];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, ${reportType === 'PREPAID' ? '#667eea 0%, #764ba2 100%' : '#f093fb 0%, #f5576c 100%'});
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .report-type-badge {
          display: inline-block;
          padding: 5px 15px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          font-size: 14px;
          margin-top: 10px;
          font-weight: 600;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .content ul {
          padding-left: 20px;
        }
        .content li {
          margin: 8px 0;
        }
        .info-box {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .info-box p {
          margin: 10px 0;
        }
        .info-box strong {
          color: ${reportType === 'PREPAID' ? '#667eea' : '#f5576c'};
        }
        .attachments-box {
          background: ${reportType === 'PREPAID' ? '#e8f4f8' : '#ffe8f0'};
          padding: 15px;
          border-left: 4px solid ${reportType === 'PREPAID' ? '#0066cc' : '#f5576c'};
          margin: 20px 0;
        }
        .attachments-box ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .attachments-box li {
          margin: 5px 0;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          background: ${reportType === 'PREPAID' ? '#667eea' : '#f5576c'};
          color: white;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 5px;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Mesečni izveštaj</h1>
        <div class="report-type-badge">${reportType}</div>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Parking Servis - ${serviceName}</p>
      </div>
      
      <div class="content">
        ${bodyText}
        
        <div class="info-box">
          <p><strong>📍 Parking servis:</strong> ${serviceName}</p>
          <p><strong>📅 Period:</strong> ${monthName} ${year}</p>
          <p><strong>📎 Broj izveštaja:</strong> ${attachmentCount}</p>
          <p><strong>🏷️ Tip izveštaja:</strong> ${reportType}</p>
        </div>
        
        <div class="attachments-box">
          <p style="margin: 0 0 10px 0;"><strong>Priloženi fajlovi:</strong></p>
          <ul>
            ${reports.map(r => `
              <li>
                ${r.name}
                <span class="badge">${r.type}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <p style="margin-top: 30px;">Srdačan pozdrav,<br><strong>Tim za upravljanje ugovorima</strong></p>
      </div>
      
      <div class="footer">
        <p style="margin: 0;">
          Ovo je automatski generisan email. Molimo ne odgovarajte direktno na ovu poruku.
        </p>
        <p style="margin: 10px 0 0 0;">
          © ${new Date().getFullYear()} Contract Management System. Sva prava zadržana.
        </p>
      </div>
    </body>
    </html>
  `;
}