private async getOrCreateContract(
  providerId: string,
  filename: string
): Promise<{ contract: Contract }> {
  const contractType = this.detectContractType(filename);
  const contractName = this.extractContractName(filename);
  const contractNumberPrefix = `VAS-${contractType}-`;

  const existingContract = await prisma.contract.findFirst({
    where: {
      providerId,
      contractNumber: { startsWith: contractNumberPrefix },
      status: 'ACTIVE'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existingContract) return { contract: existingContract };

  const newContract = await prisma.contract.create({
    data: {
      name: contractName,
      contractNumber: `${contractNumberPrefix}${Date.now().toString().slice(-6)}`,
      type: 'PROVIDER',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      providerId,
      createdById: this.currentUserId,
      revenuePercentage: 0,
      description: `Auto-created contract for ${contractName} services`
    }
  });

  return { contract: newContract };
}