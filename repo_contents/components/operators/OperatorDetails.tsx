// components/operators/OperatorDetails.tsx


"use client";

import { Operator } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Globe, Mail, Phone, Calendar, FileEdit } from "lucide-react";
import Image from "next/image";

interface OperatorDetailsProps {
  operator: Operator;
}

export function OperatorDetails({ operator }: OperatorDetailsProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Operator Information</span>
            <Badge variant={operator.active ? "success" : "destructive"}>
              {operator.active ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Basic details about the operator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Logo */}
            {operator.logoUrl && (
              <div className="flex justify-center md:col-span-2">
                <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                  <Image
                    src={operator.logoUrl}
                    alt={`${operator.name} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1 text-lg font-medium">{operator.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Code</h3>
                <p className="mt-1">{operator.code}</p>
              </div>

              {operator.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 whitespace-pre-wrap">{operator.description}</p>
                </div>
              )}
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4">
              {operator.website && (
                <div className="flex items-start gap-2">
                  <Globe className="mt-1 h-4 w-4 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Website</h3>
                    <a
                      href={operator.website.startsWith('http') ? operator.website : `https://${operator.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-blue-600 hover:underline"
                    >
                      {operator.website}
                    </a>
                  </div>
                </div>
              )}

              {operator.contactEmail && (
                <div className="flex items-start gap-2">
                  <Mail className="mt-1 h-4 w-4 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <a
                      href={`mailto:${operator.contactEmail}`}
                      className="mt-1 inline-block text-blue-600 hover:underline"
                    >
                      {operator.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {operator.contactPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-1 h-4 w-4 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <a
                      href={`tel:${operator.contactPhone}`}
                      className="mt-1 inline-block text-blue-600 hover:underline"
                    >
                      {operator.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            System-managed details about the operator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p>{formatDate(operator.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-gray-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p>{formatDate(operator.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}