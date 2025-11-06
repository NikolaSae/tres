// app/(protected)/analytics/loading.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Title skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Filter skeleton */}
            <Skeleton className="h-10 w-full max-w-3xl" />

            {/* KPI Cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <Skeleton className="h-4 w-20" />
                            </CardTitle>
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-24 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>

                {/* Charts skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardTitle>
                                    <Skeleton className="h-6 w-32" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[300px] w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}