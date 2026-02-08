//app/(protected)/admin/security/activity-logs/page.tsx"
import { db } from "@/lib/db";
import { auth } from "@/auth";
import ActivityLog from "@/components/security/ActivityLog";
import { z } from "zod";

const initialLogsParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ActivityLogsPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return <div>Unauthorized</div>;
  }

  // Await searchParams (Next.js 15 compatibility)
  const params = await searchParams;

  const initialParams = {
    page: params?.page,
    limit: params?.limit,
  };

  const validatedInitialParams = initialLogsParamsSchema.parse(initialParams);

  const skip = (validatedInitialParams.page - 1) * validatedInitialParams.limit;
  const take = validatedInitialParams.limit;

  try {
    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
      }),
      db.activityLog.count(),
    ]);

    const totalPages = Math.ceil(total / take);

    const initialPagination = {
      total,
      page: validatedInitialParams.page,
      limit: take,
      totalPages,
    };

    return (
      <div className="p-4">
        <ActivityLog
          initialLogs={logs}
          initialPagination={initialPagination}
          showFilters
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching initial activity logs:", error);
    return (
      <div className="p-4">
        <div className="text-red-600">Failed to load activity logs.</div>
      </div>
    );
  }
}