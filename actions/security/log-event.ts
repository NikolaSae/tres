// Path: actions/security/log-event.ts (ili gde god se nalazi getActivityLogs)

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LogSeverity, ActivityLog as PrismaActivityLog } from "@prisma/client";
import { z } from "zod"; // Moguće da treba Zod i ovde za validaciju ulaza
import { subHours, subDays, subWeeks, subMonths } from "date-fns"; // Ako koristite vremenske opsege, iako ovde koristimo datume

interface GetActivityLogsFilters {
  severity?: LogSeverity;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  page?: number;
  limit?: number; // Page size
}

interface GetActivityLogsResult {
  logs: (PrismaActivityLog & { user: { id: string; name: string | null; email: string; role: string } | null })[];
  total: number;
}

export async function getActivityLogs(filters: GetActivityLogsFilters): Promise<GetActivityLogsResult> {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
             // Vraćamo prazan niz i total 0 ako korisnik nije autorizovan
            return { logs: [], total: 0 };
        }

        // Opciono: Validacija ulaznih filtera pomoću Zoda
        // const validatedFilters = vašZodSema.parse(filters);

        const whereConditions: any = {};

        if (filters.severity) {
            whereConditions.severity = filters.severity;
        }
        if (filters.entityType) {
            whereConditions.entityType = filters.entityType;
        }
         if (filters.userId) {
            whereConditions.userId = filters.userId;
        }
         if (filters.action) {
            whereConditions.action = filters.action;
        }

        // Datumski opseg
        if (filters.startDate || filters.endDate) {
            whereConditions.createdAt = {};
            if (filters.startDate) {
                whereConditions.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                 // Dodajte 1 dan i oduzmite 1ms da biste uključili ceo krajnji dan
                 const endDatePlusOneDay = new Date(filters.endDate);
                 endDatePlusOneDay.setDate(endDatePlusOneDay.getDate() + 1);
                 whereConditions.createdAt.lt = endDatePlusOneDay; // Koristi 'manje od' sutrašnjeg početka
            }
        }

        // Paginacija
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;


        const [logs, total] = await Promise.all([
            db.activityLog.findMany({
                where: whereConditions,
                 include: {
                    user: { // Uključi podatke o korisniku
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        }
                    }
                 },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            db.activityLog.count({
                where: whereConditions,
            }),
        ]);

        return { logs, total };

    } catch (error) {
        console.error("[GET_ACTIVITY_LOGS_ACTION_ERROR]", error);
        // Vraćamo prazan niz i total 0 u slučaju greške
        return { logs: [], total: 0 };
    }
}

// Ako je potrebno, ovde mogu biti i druge akcije, npr. logEvent
// export async function logEvent(...) { ... }