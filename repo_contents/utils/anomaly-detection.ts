// /utils/anomaly-detection.ts
import { Complaint } from '@prisma/client';
import { addDays, subDays, isWithinInterval } from 'date-fns';

export type AnomalyDetectionResult = {
  detected: boolean;
  type: 'volume' | 'financial' | 'service' | 'provider' | 'none';
  details: string;
  severity: 'low' | 'medium' | 'high';
};

export type AnomalyDetectionOptions = {
  volumeThreshold?: number; // % increase over baseline
  financialThreshold?: number; // % increase over baseline
  serviceConcentrationThreshold?: number; // % of complaints for a single service
  providerConcentrationThreshold?: number; // % of complaints for a single provider
  timeWindow?: number; // days to analyze
};

const DEFAULT_OPTIONS: AnomalyDetectionOptions = {
  volumeThreshold: 50, // 50% increase
  financialThreshold: 75, // 75% increase
  serviceConcentrationThreshold: 60, // 60% for one service
  providerConcentrationThreshold: 60, // 60% for one provider
  timeWindow: 7, // 7 days
};

export async function detectAnomalies(
  recentComplaints: Complaint[],
  historicalComplaints: Complaint[],
  options: AnomalyDetectionOptions = {}
): Promise<AnomalyDetectionResult> {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  
  // No anomalies if not enough data
  if (recentComplaints.length === 0) {
    return {
      detected: false,
      type: 'none',
      details: 'Insufficient recent data',
      severity: 'low',
    };
  }

  // Check volume anomalies
  const volumeAnomaly = detectVolumeAnomaly(
    recentComplaints, 
    historicalComplaints,
    settings.volumeThreshold!,
    settings.timeWindow!
  );
  
  if (volumeAnomaly.detected) {
    return volumeAnomaly;
  }
  
  // Check financial impact anomalies
  const financialAnomaly = detectFinancialAnomaly(
    recentComplaints,
    historicalComplaints,
    settings.financialThreshold!,
    settings.timeWindow!
  );
  
  if (financialAnomaly.detected) {
    return financialAnomaly;
  }
  
  // Check service concentration anomalies
  const serviceAnomaly = detectServiceConcentration(
    recentComplaints,
    settings.serviceConcentrationThreshold!
  );
  
  if (serviceAnomaly.detected) {
    return serviceAnomaly;
  }
  
  // Check provider concentration anomalies
  const providerAnomaly = detectProviderConcentration(
    recentComplaints,
    settings.providerConcentrationThreshold!
  );
  
  if (providerAnomaly.detected) {
    return providerAnomaly;
  }
  
  // No anomalies detected
  return {
    detected: false,
    type: 'none',
    details: 'No anomalies detected',
    severity: 'low',
  };
}

function detectVolumeAnomaly(
  recentComplaints: Complaint[],
  historicalComplaints: Complaint[],
  threshold: number,
  timeWindow: number
): AnomalyDetectionResult {
  // Filter historical complaints to comparable time window
  const now = new Date();
  const recentTimeframe = { 
    start: subDays(now, timeWindow), 
    end: now 
  };
  
  // Calculate daily averages
  const recentCount = recentComplaints.length;
  const recentDailyAvg = recentCount / timeWindow;
  
  // Get historical daily average from past periods (e.g., 3 comparable periods)
  const historicalWindows = 3;
  let historicalTotal = 0;
  
  for (let i = 1; i <= historicalWindows; i++) {
    const windowStart = subDays(recentTimeframe.start, timeWindow * i);
    const windowEnd = subDays(recentTimeframe.end, timeWindow * i);
    
    const windowComplaints = historicalComplaints.filter(c => 
      isWithinInterval(c.createdAt, { start: windowStart, end: windowEnd })
    );
    
    historicalTotal += windowComplaints.length;
  }
  
  const historicalDailyAvg = historicalTotal / (timeWindow * historicalWindows);
  
  // Detect anomaly if recent average exceeds historical by threshold percentage
  if (historicalDailyAvg > 0) {
    const percentageIncrease = ((recentDailyAvg - historicalDailyAvg) / historicalDailyAvg) * 100;
    
    if (percentageIncrease >= threshold) {
      // Determine severity
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (percentageIncrease >= threshold * 2) {
        severity = 'high';
      } else if (percentageIncrease >= threshold * 1.5) {
        severity = 'medium';
      }
      
      return {
        detected: true,
        type: 'volume',
        details: `Complaint volume increased by ${Math.round(percentageIncrease)}% compared to historical average`,
        severity,
      };
    }
  }
  
  return {
    detected: false,
    type: 'none',
    details: '',
    severity: 'low',
  };
}

function detectFinancialAnomaly(
  recentComplaints: Complaint[],
  historicalComplaints: Complaint[],
  threshold: number,
  timeWindow: number
): AnomalyDetectionResult {
  // Calculate total financial impact
  const recentFinancialImpact = recentComplaints.reduce(
    (sum, complaint) => sum + (complaint.financialImpact || 0), 
    0
  );
  
  // Get historical financial impact from past periods
  const now = new Date();
  const recentTimeframe = { 
    start: subDays(now, timeWindow), 
    end: now 
  };
  
  const historicalWindows = 3;
  let historicalFinancialImpact = 0;
  
  for (let i = 1; i <= historicalWindows; i++) {
    const windowStart = subDays(recentTimeframe.start, timeWindow * i);
    const windowEnd = subDays(recentTimeframe.end, timeWindow * i);
    
    const windowComplaints = historicalComplaints.filter(c => 
      isWithinInterval(c.createdAt, { start: windowStart, end: windowEnd })
    );
    
    const windowImpact = windowComplaints.reduce(
      (sum, complaint) => sum + (complaint.financialImpact || 0), 
      0
    );
    
    historicalFinancialImpact += windowImpact;
  }
  
  const historicalAvgImpact = historicalFinancialImpact / historicalWindows;
  
  // Detect anomaly if recent financial impact exceeds historical by threshold percentage
  if (historicalAvgImpact > 0) {
    const percentageIncrease = ((recentFinancialImpact - historicalAvgImpact) / historicalAvgImpact) * 100;
    
    if (percentageIncrease >= threshold) {
      // Determine severity
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (percentageIncrease >= threshold * 2) {
        severity = 'high';
      } else if (percentageIncrease >= threshold * 1.5) {
        severity = 'medium';
      }
      
      return {
        detected: true,
        type: 'financial',
        details: `Financial impact increased by ${Math.round(percentageIncrease)}% compared to historical average`,
        severity,
      };
    }
  }
  
  return {
    detected: false,
    type: 'none',
    details: '',
    severity: 'low',
  };
}

function detectServiceConcentration(
  complaints: Complaint[],
  threshold: number
): AnomalyDetectionResult {
  if (complaints.length < 5) {
    return {
      detected: false,
      type: 'none',
      details: 'Insufficient data for service concentration analysis',
      severity: 'low',
    };
  }
  
  // Count complaints by service
  const serviceCount: Record<string, number> = {};
  let totalWithService = 0;
  
  complaints.forEach(complaint => {
    if (complaint.serviceId) {
      totalWithService++;
      serviceCount[complaint.serviceId] = (serviceCount[complaint.serviceId] || 0) + 1;
    }
  });
  
  // Find service with highest concentration
  let maxService = '';
  let maxCount = 0;
  
  Object.entries(serviceCount).forEach(([serviceId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxService = serviceId;
    }
  });
  
  // Calculate percentage and check threshold
  if (totalWithService > 0) {
    const concentration = (maxCount / totalWithService) * 100;
    
    if (concentration >= threshold) {
      // Determine severity
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (concentration >= threshold * 1.5) {
        severity = 'high';
      } else if (concentration >= threshold * 1.25) {
        severity = 'medium';
      }
      
      return {
        detected: true,
        type: 'service',
        details: `Service concentration: ${Math.round(concentration)}% of complaints for a single service`,
        severity,
      };
    }
  }
  
  return {
    detected: false,
    type: 'none',
    details: '',
    severity: 'low',
  };
}

function detectProviderConcentration(
  complaints: Complaint[],
  threshold: number
): AnomalyDetectionResult {
  if (complaints.length < 5) {
    return {
      detected: false,
      type: 'none',
      details: 'Insufficient data for provider concentration analysis',
      severity: 'low',
    };
  }
  
  // Count complaints by provider
  const providerCount: Record<string, number> = {};
  let totalWithProvider = 0;
  
  complaints.forEach(complaint => {
    if (complaint.providerId) {
      totalWithProvider++;
      providerCount[complaint.providerId] = (providerCount[complaint.providerId] || 0) + 1;
    }
  });
  
  // Find provider with highest concentration
  let maxProvider = '';
  let maxCount = 0;
  
  Object.entries(providerCount).forEach(([providerId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxProvider = providerId;
    }
  });
  
  // Calculate percentage and check threshold
  if (totalWithProvider > 0) {
    const concentration = (maxCount / totalWithProvider) * 100;
    
    if (concentration >= threshold) {
      // Determine severity
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (concentration >= threshold * 1.5) {
        severity = 'high';
      } else if (concentration >= threshold * 1.25) {
        severity = 'medium';
      }
      
      return {
        detected: true,
        type: 'provider',
        details: `Provider concentration: ${Math.round(concentration)}% of complaints for a single provider`,
        severity,
      };
    }
  }
  
  return {
    detected: false,
    type: 'none',
    details: '',
    severity: 'low',
  };
}