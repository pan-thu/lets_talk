"use client";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const pageNumbers = [];
  const maxPagesToShow = 5; // Number of page links to show around current page
  const halfPagesToShow = Math.floor(maxPagesToShow / 2);

  if (totalPages <= maxPagesToShow + 2) {
    // Show all pages if not too many
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1); // Always show first page

    let startPage = Math.max(2, currentPage - halfPagesToShow);
    let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);

    if (currentPage - halfPagesToShow <= 2) {
      endPage = Math.min(totalPages - 1, 1 + maxPagesToShow - 1); // -1 because 1 is already pushed
    }
    if (currentPage + halfPagesToShow >= totalPages - 1) {
      startPage = Math.max(2, totalPages - maxPagesToShow + 1); // +1 because totalPages is already pushed
    }

    if (startPage > 2) {
      pageNumbers.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }

    pageNumbers.push(totalPages); // Always show last page
  }

  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center justify.center space-x-2">
        {/* Previous button */}
        <li>
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors duration-150 ${
              currentPage === 1
                ? "cursor-not-allowed opacity-50"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Previous page"
          >
            «
          </button>
        </li>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          <li key={index}>
            {typeof page === "string" ? (
              <span className="px-2 py-1 text-sm text-gray-700">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                disabled={page === currentPage}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors duration-150 ${
                  page === currentPage
                    ? "cursor-default bg-red-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                } `}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Next button */}
        <li>
          <button
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            disabled={currentPage === totalPages}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors duration-150 ${
              currentPage === totalPages
                ? "cursor-not-allowed opacity-50"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Next page"
          >
            »
          </button>
        </li>
      </ul>
    </nav>
  );
}
