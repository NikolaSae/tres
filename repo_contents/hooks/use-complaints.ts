// Path: hooks/use-complaints.ts
import { useState, useEffect, useCallback } from "react";
import { ComplaintStatus } from "@/lib/types/enums";
import { Complaint, ComplaintWithRelations } from "@/lib/types/complaint-types";

interface UseComplaintsParams {
  id?: string;
  status?: ComplaintStatus | string | null;
  serviceId?: string | null;
  providerId?: string | null;
  productId?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  search?: string | null;
  limit?: number;
  page?: number;
}

interface UseComplaintsResult {
  complaints: ComplaintWithRelations[] | null; // Može biti null dok se učitava
  complaint: ComplaintWithRelations | null;
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  totalPages: number;
  refresh: () => Promise<void>;
}

export function useComplaints(params: UseComplaintsParams = {}): UseComplaintsResult {
  // Inicijalizujemo complaints kao null pre prvog dohvatanja
  const [complaints, setComplaints] = useState<ComplaintWithRelations[] | null>(null);
  const [complaint, setComplaint] = useState<ComplaintWithRelations | null>(null);
  // Postavljamo isLoading na true na početku, jer se fetch dešava pri montaži
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Raspakujemo parametre da bi ih koristili u dependency array-u useCallback-a
  const {
    id,
    status,
    serviceId,
    providerId,
    productId,
    startDate,
    endDate,
    search,
    limit = 10, // Podrazumevana vrednost
    page = 1, // Podrazumevana vrednost
  } = params;

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Resetujemo stanja koja će biti popunjena novim podacima
    setComplaints(null);
    setComplaint(null);
    setTotalCount(0);
    setTotalPages(0);


    const getValidDate = (dateParam?: Date | string | null): Date | undefined => {
      if (!dateParam) return undefined;
      const date = dateParam instanceof Date ? dateParam : new Date(dateParam);
      return isNaN(date.getTime()) ? undefined : date;
    };

    try {
      if (id) {
        // --- Dohvatanje jedne pritužbe ---
        const response = await fetch(`/api/complaints/${id}`);

        if (!response.ok) {
          // Pokušajte da pročitate tekst greške iz odgovora ako je dostupan
           const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Error fetching complaint ${id}: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        // Očekujemo da single fetch vraća objekat pritužbe direktno
        setComplaint(data as ComplaintWithRelations);
        setTotalCount(1);
        setTotalPages(1);
        setComplaints([data] as ComplaintWithRelations[]); // Postavljamo complaints kao niz sa jednim elementom
        // Nema potrebe za daljim kodom ako smo dohvatili single complaint
      } else {
          // --- Izgradnja query parametara za listu pritužbi ---
          const queryParams = new URLSearchParams();

          if (status) queryParams.append("status", status);
          if (serviceId) queryParams.append("serviceId", serviceId);
          if (providerId) queryParams.append("providerId", providerId);
          if (productId) queryParams.append("productId", productId);

          const validStartDate = getValidDate(startDate);
          if (validStartDate) {
               queryParams.append("startDate", validStartDate.toISOString());
          }

          const validEndDate = getValidDate(endDate);
          if (validEndDate) {
               queryParams.append("endDate", validEndDate.toISOString());
          }

          if (search) queryParams.append("search", search);
          if (limit) queryParams.append("limit", limit.toString()); // Šaljemo limit
          if (page) queryParams.append("page", page.toString()); // Šaljemo page

          // --- Dohvatanje liste pritužbi ---
          const response = await fetch(`/api/complaints?${queryParams.toString()}`);

          if (!response.ok) {
             const errorText = await response.text().catch(() => response.statusText);
            throw new Error(`Error fetching complaints list: ${response.status} ${errorText}`);
          }

          const data = await response.json();

          // --- Rukovanje odgovorom za listu pritužbi ---
          // Očekujemo { complaints: [...], totalCount: ..., totalPages: ... } sa backend-a
          setComplaints(data.complaints || []); // Postavljamo listu pritužbi
          setTotalCount(data.totalCount || 0); // Postavljamo ukupan broj sa korena objekta
          setTotalPages(data.totalPages || 0); // Postavljamo ukupan broj stranica sa korena objekta
      }

    } catch (err: any) {
      console.error("useComplaints fetch error:", err); // Logujemo grešku u hooku
      setError(err instanceof Error ? err : new Error(String(err)));
      setComplaints([]); // Postavljamo na prazan niz u slučaju greške liste
      setComplaint(null); // Postavljamo na null u slučaju greške pojedinačne pritužbe
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    id, // Zavisnost za single fetch
    status, // Zavisnosti za list fetch
    serviceId,
    providerId,
    productId,
    startDate,
    endDate,
    search,
    limit,
    page
  ]); // Navodimo sve parametre kao zavisnosti callback-a

  useEffect(() => {
    // Ovaj useEffect će se pokrenuti pri montaži i svaki put kada se promeni identitet fetchComplaints funkcije.
    // Identitet fetchComplaints se menja samo kada se promene njene zavisnosti (parametri hooka).
    // Time osiguravamo da se dohvatanje pokrene pri montaži i pri svakoj promeni filtera/paginacije/id-a.
    let isMounted = true;

    const performFetch = async () => {
      if (isMounted) {
        await fetchComplaints();
      }
    };

    performFetch(); // Odmah pozovi dohvatanje

    // Funkcija za čišćenje koja se pokreće pri demontaži komponente ili ponovnom pokretanju efekta
    return () => {
      isMounted = false;
    };
  }, [fetchComplaints]); // Zavisimo samo od fetchComplaints callback-a

  // Refresh funkcija koristi isti callback
  const refresh = useCallback(async () => {
    await fetchComplaints();
  }, [fetchComplaints]);

  return {
    complaints,
    complaint,
    isLoading,
    error,
    totalCount,
    totalPages,
    refresh
  };
}