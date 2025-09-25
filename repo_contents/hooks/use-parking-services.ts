//hooks/use-parking-services.ts

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  getAllParkingServices, 
  getParkingServices, 
  getParkingServiceById,
  create,
  update,
  deleteService
} from "@/actions/parking-services";
import { 
  ParkingServiceFilters, 
  CreateParkingServiceParams,
  UpdateParkingServiceParams,
  PaginatedParkingServices
} from "@/lib/types/parking-service-types";

export function useParkingServices() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState<PaginatedParkingServices | null>(null);

  // Fetch all parking services without pagination
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllParkingServices();
      setIsLoading(false);
      
      if (!response.success) {
        toast.error(response.error || "Failed to fetch parking services");
        return null;
      }
      
      return response.data;
    } catch (error) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
      console.error("Error in fetchAll:", error);
      return null;
    }
  }, []);

  // Fetch parking services with filtering and pagination
  const fetch = useCallback(async (filters: ParkingServiceFilters) => {
    setIsLoading(true);
    try {
      const response = await getParkingServices(filters);
      setIsLoading(false);
      
      if (!response.success) {
        toast.error(response.error || "Failed to fetch parking services");
        return null;
      }
      
      setPaginatedData(response.data);
      return response.data;
    } catch (error) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
      console.error("Error in fetch:", error);
      return null;
    }
  }, []);

  // Fetch a single parking service by ID
  const fetchById = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await getParkingServiceById(id);
      setIsLoading(false);
      
      if (!response.success) {
        toast.error(response.error || "Failed to fetch parking service");
        return null;
      }
      
      return response.data;
    } catch (error) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
      console.error("Error in fetchById:", error);
      return null;
    }
  }, []);

  // Create a new parking service
  const createParkingService = useCallback(async (data: CreateParkingServiceParams) => {
    setIsLoading(true);
    try {
      const response = await create(data);
      setIsLoading(false);
      
      if (!response.success) {
        toast.error(response.error || "Failed to create parking service");
        return null;
      }
      
      toast.success("Parking service created successfully");
      router.push("/parking-services");
      router.refresh();
      return response.data;
    } catch (error) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
      console.error("Error in createParkingService:", error);
      return null;
    }
  }, [router]);

  // Update an existing parking service
  const updateParkingService = useCallback(async (data: UpdateParkingServiceParams) => {
    setIsLoading(true);
    try {
      const response = await update(data);
      setIsLoading(false);
      
      if (!response.success) {
        toast.error(response.error || "Failed to update parking service");
        return null;
      }
      
      toast.success("Parking service updated successfully");
      router.refresh();
      return response.data;
    } catch (error) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
      console.error("Error in updateParkingService:", error);
      return null;
    }
  }, [router]);

  // Delete a parking service
  const deleteParkingService = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await deleteService(id);
      setIsLoading(false);
      
      if (!response.success) {
        toast.error(response.error || "Failed to delete parking service");
        return false;
      }
      
      toast.success("Parking service deleted successfully");
      router.refresh();
      return true;
    } catch (error) {
      setIsLoading(false);
      toast.error("An unexpected error occurred");
      console.error("Error in deleteParkingService:", error);
      return false;
    }
  }, [router]);

  return {
    isLoading,
    paginatedData,
    fetchAll,
    fetch,
    fetchById,
    createParkingService,
    updateParkingService,
    deleteParkingService
  };
}