// lib/actions/report.actions.ts
export async function fetchInitialReports(page: number = 1, limit: number = 10) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/reports?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Greška pri učitavanju izveštaja');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching initial reports:', error);
    return [];
  }
}