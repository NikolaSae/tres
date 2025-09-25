// components/parking-services/ParkingServiceReports.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Report {
  id: string;
  title: string;
  createdAt: string;
  status: string;
}

interface Props {
  parkingServiceId: string;
}

export default function ParkingServiceReports({ parkingServiceId }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/parking-services/${parkingServiceId}/reports`);
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        setReports(data.reports || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [parkingServiceId]);

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (reports.length === 0) return <div>No reports found for this service.</div>;

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-sm text-muted-foreground">
                Created at: {new Date(report.createdAt).toLocaleString()}
              </p>
              <p className="text-sm">Status: {report.status}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/parking-services/${parkingServiceId}/reports/${report.id}`, "_blank")}
            >
              View
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
