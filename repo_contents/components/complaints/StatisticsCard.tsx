// /components/complaints/StatisticsCard.tsx

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface StatisticsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  description?: string;
  colorClass?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  description,
  colorClass = "bg-gray-50 border-gray-200",
  trend
}) => {
  return (
    <Card className={`${colorClass} border`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="mt-1 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              
              {trend && (
                <span className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.direction === 'up'
                    ? 'text-green-600'
                    : trend.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}>
                  {trend.direction === 'up' ? (
                    <svg className="w-5 h-5 self-center text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : trend.direction === 'down' ? (
                    <svg className="w-5 h-5 self-center text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 self-center text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{trend.percentage}%</span>
                </span>
              )}
            </div>
            
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          
          {icon && (
            <div className="p-3 rounded-full bg-opacity-10">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};