
Set Outlook = CreateObject("Outlook.Application")
Set Mail = Outlook.CreateItem(0)
Mail.To = "nikolaj@telekom.rs;nikolaj@telekom.rs"
Mail.Subject = "Mesečni PREPAID izveštaj - Aleksandrovac - Maj 2025"
Mail.Body = "Poštovani,

U prilogu se nalazi mesečni PREPAID izveštaj za Aleksandrovac, Maj 2025.

Srdačno,
nikola J"
Mail.Attachments.Add("/workspaces/tres/public/parking-service/aleksandrovac/report/2025/5/original/Servis__MicropaymentMerchantReport_SDP_mParking_Aleksandrovac_12_1262__20250501_0000__20250531_2359_2025-06-20T15-45-22-219Z.xls")
Mail.Attachments.Add("/workspaces/tres/public/parking-service/aleksandrovac/report/2025/5/original/Servis__MicropaymentMerchantReport_SDP_mParking_Aleksandrovac_12_1262__20250501_0000__20250531_2359_2025-06-20T15-45-22-219Z_2025-06-20T16-28-04-466Z.xls")
Mail.Attachments.Add("/workspaces/tres/public/parking-service/aleksandrovac/report/2025/5/original/Servis__MicropaymentMerchantReport_SDP_mParking_Aleksandrovac_12_1262__20250501_0000__20250531_2359_2025-06-20T15-45-22-219Z_2025-10-06T14-52-30-376Z.xls")
Mail.Display
