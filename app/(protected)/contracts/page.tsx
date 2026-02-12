// app/(protected)/contracts/page.tsx
import ContractsSection from "@/components/contracts/ContractsSection";
import { db } from "@/lib/db";
import { ContractStatus, ContractType as PrismaContractType } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ContractsPage({ searchParams }: PageProps) {
  // Await searchParams - required in Next.js 15
  const params = await searchParams;

  const safeParams = {
    page: params.page || "1",
    limit: params.limit || "25",
    search: params.search || "",
    status: params.status || "",
    type: params.type || "",
    partner: params.partner || "",
  };

  const pageNumber = parseInt(safeParams.page);
  const limitNumber = parseInt(safeParams.limit);

  const where: any = {};
  if (safeParams.search) {
    where.OR = [
      { name: { contains: safeParams.search, mode: "insensitive" } },
      { contractNumber: { contains: safeParams.search, mode: "insensitive" } },
      { description: { contains: safeParams.search, mode: "insensitive" } },
    ];
  }

  if (safeParams.status && Object.values(ContractStatus).includes(safeParams.status as ContractStatus)) {
    where.status = safeParams.status;
  }

  if (safeParams.type && Object.values(PrismaContractType).includes(safeParams.type as PrismaContractType)) {
    where.type = safeParams.type;
  }

  if (safeParams.partner) {
    where.OR = [
      { providerId: safeParams.partner },
      { humanitarianOrgId: safeParams.partner },
      { parkingServiceId: safeParams.partner },
    ];
  }

  const [rawContracts, totalCount] = await Promise.all([
    db.contract.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true } },
        humanitarianOrg: { select: { id: true, name: true } },
        parkingService: { select: { id: true, name: true } },
        services: {
          include: {
            service: true,
          },
        },
        _count: { select: { services: true, attachments: true, reminders: true } },
      },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      orderBy: { updatedAt: "desc" },
    }),
    db.contract.count({ where }),
  ]);

  // Transform the data to match the expected Contract type
  const contracts = rawContracts.map(contract => ({
    ...contract,
    services: contract.services.map(cs => cs.service),
    provider: contract.provider ? { name: contract.provider.name } : undefined,
    humanitarianOrg: contract.humanitarianOrg ? { name: contract.humanitarianOrg.name } : undefined,
    parkingService: contract.parkingService ? { name: contract.parkingService.name } : undefined,
  }));

  return (
    <ContractsSection
      initialContracts={contracts}
      initialTotalCount={totalCount}
      initialTotalPages={Math.ceil(totalCount / limitNumber)}
      initialCurrentPage={pageNumber}
      initialLimit={limitNumber}
    />
  );
}