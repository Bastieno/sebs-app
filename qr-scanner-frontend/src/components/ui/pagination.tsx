'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPage?: boolean;
  className?: string;
}

export function Pagination({
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 25, 50, 100],
  showItemsPerPage = true,
  className = '',
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <p className="text-sm text-gray-600 text-center sm:text-left">
          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{totalItems}</span> items
        </p>
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-sm text-gray-600 whitespace-nowrap">
              Per page:
            </label>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                onItemsPerPageChange(Number(value));
                onPageChange(1); // Reset to first page when changing items per page
              }}
            >
              <SelectTrigger className="w-[70px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="hidden sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        {/* Mobile: Show only icon */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="sm:hidden px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {/* Desktop: Show more page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {/* First page */}
            {currentPage > 3 && (
              <>
                <Button
                  variant={1 === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(1)}
                  className="w-9"
                >
                  1
                </Button>
                {currentPage > 4 && (
                  <span className="px-1 text-gray-500">...</span>
                )}
              </>
            )}

            {/* Page numbers around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === currentPage ||
                  page === currentPage - 1 ||
                  page === currentPage - 2 ||
                  page === currentPage + 1 ||
                  page === currentPage + 2
                );
              })
              .map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="w-9"
                >
                  {page}
                </Button>
              ))}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="px-1 text-gray-500">...</span>
                )}
                <Button
                  variant={totalPages === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  className="w-9"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Mobile: Show only current page and adjacent pages */}
          <div className="flex sm:hidden items-center gap-1">
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                className="w-8"
              >
                {currentPage - 1}
              </Button>
            )}
            
            <Button
              variant="default"
              size="sm"
              className="w-8"
            >
              {currentPage}
            </Button>
            
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                className="w-8"
              >
                {currentPage + 1}
              </Button>
            )}
            
            {currentPage < totalPages - 1 && (
              <>
                <span className="px-1 text-gray-500 text-xs">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  className="w-8"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Mobile: Show only icon */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="sm:hidden px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
