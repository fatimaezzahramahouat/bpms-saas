import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showPageInfo?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
  showPageInfo = true,
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Calculate showing range
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle page change with transition
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setIsTransitioning(true);
    onPageChange(page);

    // Scroll to top of list
    const listElement = document.getElementById('candidates-list');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Handle jump to page
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setJumpToPage('');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, page: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePageChange(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Don't render if only one page
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-[var(--text-secondary)] order-2 sm:order-1">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement...
            </span>
          ) : (
            <span>
              Affichage <span className="font-medium text-[var(--text-primary)]">{startItem}-{endItem}</span> sur{' '}
              <span className="font-medium text-[var(--text-primary)]">{totalItems}</span> candidatures
            </span>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First Page Button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-purple-400 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Première page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-purple-400 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => handlePageChange(page)}
                onKeyDown={(e) => handleKeyDown(e, page)}
                disabled={isLoading}
                className={`w-9 h-9 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? 'bg-purple-600 text-white'
                    : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-purple-400 hover:border-purple-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ) : (
              <span
                key={index}
                className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)]"
              >
                {page}
              </span>
            )
          ))}
        </div>

        {/* Current Page Indicator - Mobile */}
        <span className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-purple-600 text-white font-medium text-sm">
          {currentPage}/{totalPages}
        </span>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-purple-400 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-purple-400 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Dernière page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Jump to Page - Desktop */}
        <form
          onSubmit={handleJumpToPage}
          className="hidden lg:flex items-center gap-2 ml-2"
        >
          <span className="text-sm text-[var(--text-secondary)]">Aller à</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            placeholder="#"
            className="w-14 h-9 px-2 text-center bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!jumpToPage || isLoading}
            className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            OK
          </button>
        </form>
      </div>
    </div>
  );
}

// Loading skeleton for pagination
export function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="h-5 w-48 bg-[var(--input-bg)] rounded animate-pulse" />
      <div className="flex items-center gap-1">
        <div className="w-9 h-9 bg-[var(--input-bg)] rounded animate-pulse" />
        <div className="w-9 h-9 bg-[var(--input-bg)] rounded animate-pulse" />
        <div className="w-9 h-9 bg-[var(--input-bg)] rounded animate-pulse" />
        <div className="w-9 h-9 bg-[var(--input-bg)] rounded animate-pulse" />
        <div className="w-9 h-9 bg-[var(--input-bg)] rounded animate-pulse" />
      </div>
    </div>
  );
}

export default Pagination;
