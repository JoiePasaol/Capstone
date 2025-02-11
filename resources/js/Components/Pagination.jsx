const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  
    const pageNumbers = [];
    const maxVisiblePages = 5; 

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const handlePageClick = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        onPageChange(pageNumber);
    };

    const getVisiblePages = () => {
        if (totalPages <= maxVisiblePages) {
            return pageNumbers; 
        }

        if (currentPage <= 3) {
            return [1, 2, 3, 4, 5, "...", totalPages];
        } else if (currentPage >= totalPages - 2) {
            return [
                1,
                "...",
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        } else {
            return [
                1,
                "...",
                currentPage - 1,
                currentPage,
                currentPage + 1,
                "...",
                totalPages,
            ];
        }
    };

    return (
        <div className="flex justify-center mt-4 space-x-4">
            {totalPages > 1 && (
                <button
                    onClick={() => handlePageClick(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-400 dark:bg-gray-700 text-white rounded-l-md"
                >
                    &lt;
                </button>
            )}

     
            {getVisiblePages().map((page, index) => (
                <button
                    key={index}
                    onClick={() => {
                        if (page !== "...") {
                            handlePageClick(page);
                        }
                    }}
                    className={`px-4 py-2 ${
                        page === currentPage
                            ? "text-white bg-blue-500"
                            : "text-black/50 bg-gray-300 dark:text-white dark:bg-gray-700"
                    } rounded-md`}
                    disabled={page === "..."}
                >
                    {page}
                </button>
            ))}

            {totalPages > 1 && (
                <button
                    onClick={() => handlePageClick(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-400 dark:bg-gray-700 text-white rounded-r-md"
                >
                    &gt;
                </button>
            )}
        </div>
    );
};

export default Pagination;
