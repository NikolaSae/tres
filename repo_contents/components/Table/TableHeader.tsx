// components/Table/TableHeader.tsx
"use client";

import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export const TableHeader = ({
  columnKey,
  label,
  sortable,
  sortConfig,
  onSort,
}: {
  columnKey: string;
  label: string;
  sortable?: boolean;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}) => {
  const canSort = sortable && onSort;
  const sortDirection = sortConfig?.key === columnKey ? sortConfig.direction : null;

  return (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        canSort ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={canSort ? () => onSort(columnKey) : undefined}
    >
      <div className="flex items-center">
        {label}
        {canSort && (
          <span className="ml-2">
            {!sortDirection && <ChevronUpDownIcon className="h-4 w-4" />}
            {sortDirection === 'asc' && <ChevronUpIcon className="h-4 w-4" />}
            {sortDirection === 'desc' && <ChevronDownIcon className="h-4 w-4" />}
          </span>
        )}
      </div>
    </th>
  );
};