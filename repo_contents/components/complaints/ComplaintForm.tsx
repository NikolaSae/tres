//components/complaints/ComplaintForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Complaint } from '@prisma/client';
import { ComplaintSchema, ComplaintFormData } from '@/schemas/complaint';
import { ServiceSelection } from './ServiceSelection';
import { FileUpload } from './FileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ServiceTypeEnum = {
  PROVIDER: 'PROVIDER',
  HUMANITARIAN: 'HUMANITARIAN',
  PARKING: 'PARKING',
  BULK: 'BULK'
};

interface ComplaintFormProps {
  complaint?: Complaint | null;
  providersData?: { id: string; name: string; type: 'VAS' | 'BULK' }[]; // Dodali smo 'type'
  humanitarianOrgsData?: { id: string; name: string }[];
  parkingServicesData?: { id: string; name: string }[];
  isSubmitting?: boolean;
  onSubmit: (data: ComplaintFormData) => Promise<void>;
}

export function ComplaintForm({
  complaint,
  providersData = [],
  humanitarianOrgsData = [],
  parkingServicesData = [],
  isSubmitting = false,
  onSubmit,
}: ComplaintFormProps) {
  const [serviceType, setServiceType] = useState(complaint?.serviceType || '');
  const [selectedEntityId, setSelectedEntityId] = useState(
    complaint?.providerId || complaint?.humanitarianOrgId || complaint?.parkingServiceId || ''
  );

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(ComplaintSchema),
    defaultValues: {
      title: complaint?.title || '',
      description: complaint?.description || '',
      priority: complaint?.priority || 3,
      serviceType: complaint?.serviceType || '',
      providerId: complaint?.providerId || '',
      humanitarianOrgId: complaint?.humanitarianOrgId || '',
      parkingServiceId: complaint?.parkingServiceId || '',
      serviceId: complaint?.serviceId || '',
      financialImpact: complaint?.financialImpact ?? 0,
    },
  });

  const watchedServiceType = form.watch('serviceType');
  const watchedProviderId = form.watch('providerId');
  const watchedHumanitarianOrgId = form.watch('humanitarianOrgId');
  const watchedParkingServiceId = form.watch('parkingServiceId');

  useEffect(() => {
    if (watchedServiceType === ServiceTypeEnum.PROVIDER) {
      setSelectedEntityId(watchedProviderId);
    } else if (watchedServiceType === ServiceTypeEnum.HUMANITARIAN) {
      setSelectedEntityId(watchedHumanitarianOrgId);
    } else if (watchedServiceType === ServiceTypeEnum.PARKING) {
      setSelectedEntityId(watchedParkingServiceId);
    } else if (watchedServiceType === ServiceTypeEnum.BULK) {
      setSelectedEntityId(watchedProviderId);
    } else {
      setSelectedEntityId('');
    }
    
    if (selectedEntityId !== complaint?.providerId && 
        selectedEntityId !== complaint?.humanitarianOrgId && 
        selectedEntityId !== complaint?.parkingServiceId) {
      form.setValue('serviceId', '', { shouldValidate: true });
    }
  }, [watchedServiceType, watchedProviderId, watchedHumanitarianOrgId, watchedParkingServiceId]);

  useEffect(() => {
    if (complaint) {
      let serviceType = '';
      if (complaint.providerId) {
        // Kada se učitava postojeća žalba, serviceType bi trebalo da se odredi na osnovu serviceId prefixa
        // ili nekog drugog indikatora ako je dostupan u bazi.
        // Ova logika je i dalje upitna ako serviceId nema prefix "bulk"
        // a provajder je zapravo BULK tipa, a ne VAS.
        // Bolje bi bilo da se tip provajdera dobija iz baze direktno.
        serviceType = complaint.serviceId?.startsWith('bulk') 
          ? ServiceTypeEnum.BULK 
          : ServiceTypeEnum.PROVIDER;
      } else if (complaint.humanitarianOrgId) {
        serviceType = ServiceTypeEnum.HUMANITARIAN;
      } else if (complaint.parkingServiceId) {
        serviceType = ServiceTypeEnum.PARKING;
      }

      form.reset({
        title: complaint.title,
        description: complaint.description,
        priority: complaint.priority,
        serviceType: serviceType,
        providerId: complaint.providerId || '',
        humanitarianOrgId: complaint.humanitarianOrgId || '',
        parkingServiceId: complaint.parkingServiceId || '',
        serviceId: complaint.serviceId || '',
        financialImpact: complaint.financialImpact ?? 0,
      });
      
      setServiceType(serviceType);
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 3,
        serviceType: '',
        providerId: '',
        humanitarianOrgId: '',
        parkingServiceId: '',
        serviceId: '',
        financialImpact: 0,
      });
      
      setServiceType('');
    }
  }, [complaint, form]);

  const handleFormSubmit = async (data: ComplaintFormData) => {
    await onSubmit(data);
  };

  const handleServiceTypeChange = (type: string) => {
    form.setValue('serviceType', type, { shouldValidate: true });
    form.setValue('providerId', '', { shouldValidate: true });
    form.setValue('humanitarianOrgId', '', { shouldValidate: true });
    form.setValue('parkingServiceId', '', { shouldValidate: true });
    form.setValue('serviceId', '', { shouldValidate: true });
    setServiceType(type);
  };

  const handleEntityChange = (entityId: string) => {
    if (watchedServiceType === ServiceTypeEnum.PROVIDER || watchedServiceType === ServiceTypeEnum.BULK) {
      form.setValue('providerId', entityId, { shouldValidate: true });
    } else if (watchedServiceType === ServiceTypeEnum.HUMANITARIAN) {
      form.setValue('humanitarianOrgId', entityId, { shouldValidate: true });
    } else if (watchedServiceType === ServiceTypeEnum.PARKING) {
      form.setValue('parkingServiceId', entityId, { shouldValidate: true });
    }
    
    form.setValue('serviceId', '', { shouldValidate: true });
  };

  const handleServiceChange = (serviceId: string) => {
    form.setValue('serviceId', serviceId, { shouldValidate: true });
  };

  const renderEntitySelection = () => {
    if (!watchedServiceType) return null;

    let formFieldName = '';
    let entityData: { id: string; name: string; type?: 'VAS' | 'BULK' }[] = []; // Dodali smo 'type'
    let placeholderText = '';

    switch (watchedServiceType) {
      case ServiceTypeEnum.PROVIDER:
      case ServiceTypeEnum.BULK:
        formFieldName = 'providerId';
        entityData = providersData;
        placeholderText = 'Select provider';
        break;
      case ServiceTypeEnum.HUMANITARIAN:
        formFieldName = 'humanitarianOrgId';
        entityData = humanitarianOrgsData;
        placeholderText = 'Select humanitarian organization';
        break;
      case ServiceTypeEnum.PARKING:
        formFieldName = 'parkingServiceId';
        entityData = parkingServicesData;
        placeholderText = 'Select parking service';
        break;
      default:
        return null;
    }

    return (
      <FormField
        control={form.control}
        name={formFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{watchedServiceType === ServiceTypeEnum.HUMANITARIAN 
              ? 'Humanitarian Organization' 
              : watchedServiceType === ServiceTypeEnum.PARKING 
                ? 'Parking Service'
                : 'Provider'}
            </FormLabel>
            <Select 
              onValueChange={handleEntityChange} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholderText} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {entityData && entityData.length > 0 ? (
                  entityData.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="placeholder" disabled>
                    No {watchedServiceType === ServiceTypeEnum.HUMANITARIAN 
                      ? 'humanitarian organizations' 
                      : watchedServiceType === ServiceTypeEnum.PARKING 
                        ? 'parking services'
                        : 'providers'} available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  // Pronađi trenutno odabranog provajdera da bi prosledio njegov 'type'
  const selectedProvider = providersData.find(p => p.id === watchedProviderId);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{complaint ? 'Edit Complaint' : 'Submit New Complaint'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter complaint title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail"
                      className="min-h-[120px]"
                      {...field}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Critical</SelectItem>
                        <SelectItem value="2">2 - High</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Low</SelectItem>
                        <SelectItem value="5">5 - Very Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="financialImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Impact</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? null : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Service Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={handleServiceTypeChange}
                      value={field.value}
                      className="flex flex-wrap gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ServiceTypeEnum.PROVIDER} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Provider</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ServiceTypeEnum.BULK} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Bulk</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ServiceTypeEnum.HUMANITARIAN} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Humanitarian</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={ServiceTypeEnum.PARKING} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Parking</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedServiceType && (
              <div className="border p-4 rounded bg-slate-50">
                <h3 className="font-semibold mb-2">Debug info:</h3>
                <p>Service Type: {watchedServiceType}</p>
                <p>Providers data: {providersData.length} items</p>
                <p>Humanitarian orgs data: {humanitarianOrgsData.length} items</p>
                <p>Parking services data: {parkingServicesData.length} items</p>
                {selectedProvider && <p>Selected Provider Type: {selectedProvider.type}</p>} {/* Dodali smo debug za tip provajdera */}
              </div>
            )}

            {watchedServiceType && renderEntitySelection()}

            {selectedEntityId && (
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <ServiceSelection
                        entityId={selectedEntityId}
                        entityType={watchedServiceType}
                        selectedServiceId={field.value}
                        onServiceSelect={(id) => handleServiceChange(id)}
                        // KLJUČNA IZMENA: Prosleđujemo 'type' provajdera
                        providerCategory={selectedProvider?.type} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!complaint && (
              <div className="space-y-2">
                <FormLabel>Attachments</FormLabel>
                <FileUpload />
              </div>
            )}

            <CardFooter className="flex justify-end space-x-2 px-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : complaint ? 'Update Complaint' : 'Submit Complaint'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}