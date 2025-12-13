/**
 * @fileoverview Reusable Data Table with pagination, search, filters, sorting
 * @module shared/DataTable
 */

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Production-grade data table component.
 * 
 * @example
 * <DataTable
 *   data={workflows}
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> }
 *   ]}
 *   searchable
 *   filterable
 *   onRowClick={(row) => navigate(row.id)}
 * />
 */
export function DataTable({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  filterable = false,
  filters = [],
  sortable = true,
  paginated = true,
  pageSize = 10,
  onRowClick,
  emptyState,
  actions,
  className = ''
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeFilters, setActiveFilters] = useState({});

  // Search logic
  const searchedData = useMemo(() => {
    if (!search || !searchable) return data;
    
    const searchLower = search.toLowerCase();
    return data.filter(row => {
      if (searchKeys.length > 0) {
        return searchKeys.some(key => 
          String(row[key] || '').toLowerCase().includes(searchLower)
        );
      }
      return Object.values(row).some(val => 
        String(val || '').toLowerCase().includes(searchLower)
      );
    });
  }, [data, search, searchable, searchKeys]);

  // Filter logic
  const filteredData = useMemo(() => {
    if (!filterable || Object.keys(activeFilters).length === 0) return searchedData;
    
    return searchedData.filter(row => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        return row[key] === value;
      });
    });
  }, [searchedData, activeFilters, filterable]);

  // Sort logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {searchable && <Skeleton className="h-10 w-full max-w-sm" />}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && !loading) {
    return emptyState || <EmptyState title="No data" description="No records found" />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-700"
              />
            </div>
          )}
          
          {filterable && filters.map(filter => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || 'all'}
              onValueChange={(value) => setActiveFilters(prev => ({ ...prev, [filter.key]: value }))}
            >
              <SelectTrigger className="w-[140px] border-slate-700">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Results count */}
      {search && (
        <div className="text-sm text-slate-400">
          Found {sortedData.length} result{sortedData.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-900">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className={col.sortable !== false && sortable ? 'cursor-pointer select-none' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable !== false && sortable && (
                      <ArrowUpDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  className={`border-slate-800 ${onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400 py-8">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}