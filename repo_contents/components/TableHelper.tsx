// components/TableHelper.tsx

import React from 'react';
import { Info } from 'lucide-react';

export const getTableHeaders = (activeType: string): string[] => {
  switch (activeType) {
    case 'vas':
      return ['Proizvod', 'Mesec pružanja usluge', 'Jedin. cena', 'Broj transakcija', 'Fakturisan iznos', 'Provajder', 'Akcije'];
    case 'bulk':
      return ['Provider Name', 'Agreement Name', 'Service Name', 'Step Name', 'Sender Name', 'Requests', 'Message Parts', 'Provajder', 'Akcije'];
    case 'parking':
      return ['Naziv', 'Opis', 'Provajder', 'Akcije'];
    case 'human':
      return ['Naziv', 'Opis', 'Tip', 'Provajder', 'Akcije'];
    default:
      return [];
  }
};

export const getTableRow = (service: any, activeType: string, getProviderForService: (id: string) => any, setSelectedService: (service: any) => void): React.ReactNode => {
  switch (activeType) {
    case 'vas':
      return (
        <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
          <td className="px-6 py-4">{service.proizvod}</td>
          <td className="px-6 py-4">{new Date(service.mesec_pruzanja_usluge).toLocaleDateString()}</td>
          <td className="px-6 py-4">{service.jedinicna_cena} RSD</td>
          <td className="px-6 py-4">{service.broj_transakcija}</td>
          <td className="px-6 py-4">{service.fakturisan_iznos} RSD</td>
          <td className="px-6 py-4">{getProviderForService(service.provajderId)?.name || 'N/A'}</td>
          <td className="px-6 py-4">
            <button onClick={() => setSelectedService(service)} className="text-blue-600 hover:underline flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Detalji
            </button>
          </td>
        </tr>
      );
    case 'bulk':
      return (
        <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
          <td className="px-6 py-4">{service.provider_name}</td>
          <td className="px-6 py-4">{service.agreement_name}</td>
          <td className="px-6 py-4">{service.service_name}</td>
          <td className="px-6 py-4">{service.step_name}</td>
          <td className="px-6 py-4">{service.sender_name}</td>
          <td className="px-6 py-4">{service.requests}</td>
          <td className="px-6 py-4">{service.message_parts}</td>
          <td className="px-6 py-4">{getProviderForService(service.provajderId)?.name || 'N/A'}</td>
          <td className="px-6 py-4">
            <button onClick={() => setSelectedService(service)} className="text-blue-600 hover:underline flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Detalji
            </button>
          </td>
        </tr>
      );
    case 'parking':
      return (
        <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
          <td className="px-6 py-4">{service.name}</td>
          <td className="px-6 py-4">{service.description || 'N/A'}</td>
          <td className="px-6 py-4">{getProviderForService(service.provajderId)?.name || 'N/A'}</td>
          <td className="px-6 py-4">
            <button onClick={() => setSelectedService(service)} className="text-blue-600 hover:underline flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Detalji
            </button>
          </td>
        </tr>
      );
    case 'human':
      return (
        <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
          <td className="px-6 py-4">{service.name}</td>
          <td className="px-6 py-4">{service.description || 'N/A'}</td>
          <td className="px-6 py-4">{service.type}</td>
          <td className="px-6 py-4">{getProviderForService(service.provajderId)?.name || 'N/A'}</td>
          <td className="px-6 py-4">
            <button onClick={() => setSelectedService(service)} className="text-blue-600 hover:underline flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Detalji
            </button>
          </td>
        </tr>
      );
    default:
      return null;
  }
};
