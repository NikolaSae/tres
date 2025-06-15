// actions/contracts/get-expiring-contracts.ts
import { db } from "@/lib/db";
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

export async function getExpiringContracts(daysThreshold: number = 60) { // ✅ Changed from 30 to 60
  try {
    const today = startOfDay(new Date());
    
    // ✅ Add support for recently expired contracts (60 days ago)
    const pastThreshold = startOfDay(subDays(today, daysThreshold));
    const futureThreshold = endOfDay(addDays(today, daysThreshold));
    
    const contracts = await db.contract.findMany({
      where: {
        OR: [
          // ✅ Contracts expiring soon (within 60 days)
          {
            status: 'ACTIVE',
            endDate: {
              gte: today,
              lte: futureThreshold,
            },
          },
          // ✅ Recently expired contracts (within last 60 days)
          {
            status: 'EXPIRED',
            endDate: {
              gte: pastThreshold,
              lt: today,
            },
          },
          // Contracts in renewal process (regardless of expiry date)
          {
            status: 'RENEWAL_IN_PROGRESS'
          }
        ]
      },
      include: {
        // Partner data
        provider: {
          select: {
            id: true,
            name: true,
          }
        },
        humanitarianOrg: {
          select: {
            id: true,
            name: true,
          }
        },
        parkingService: {
          select: {
            id: true,
            name: true,
          }
        },
        // CRITICAL: Renewals data for sub-status
        renewals: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            subStatus: true,
            proposedStartDate: true,
            proposedEndDate: true,
            renewalStartDate: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        // Contract creator
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        // First by status (RENEWAL_IN_PROGRESS on top)
        {
          status: 'desc'
        },
        // Then by expiry date
        {
          endDate: 'asc'
        }
      ]
    });
    
    // Debug information
    console.log(`=== GET EXPIRING CONTRACTS RESULTS ===`);
    console.log(`Days threshold: ${daysThreshold}`);
    console.log(`Date range: ${pastThreshold.toISOString()} to ${futureThreshold.toISOString()}`);
    console.log(`Total contracts found: ${contracts.length}`);
    
    const statusBreakdown = contracts.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Status breakdown:', statusBreakdown);
    
    // Log expiry status for each contract
    contracts.forEach(contract => {
      const endDate = new Date(contract.endDate);
      const diffInMs = endDate.getTime() - today.getTime();
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
      
      console.log(`- ${contract.name}: ends in ${diffInDays} days (${contract.endDate.toISOString().split('T')[0]}), status: ${contract.status}`);
    });
    
    const renewalContracts = contracts.filter(c => c.status === 'RENEWAL_IN_PROGRESS');
    console.log(`RENEWAL_IN_PROGRESS contracts: ${renewalContracts.length}`);
    
    if (renewalContracts.length > 0) {
      renewalContracts.forEach(contract => {
        console.log(`- ${contract.name}: renewals=${contract.renewals?.length || 0}, subStatus=${contract.renewals?.[0]?.subStatus || 'N/A'}`);
      });
    }
    
    return contracts;
  } catch (error) {
    console.error("Failed to fetch expiring contracts:", error);
    return [];
  }
}