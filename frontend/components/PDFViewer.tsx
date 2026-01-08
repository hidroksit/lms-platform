'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PDFViewerProps {
    src: string;
    title?: string;
    onProgress?: (progress: number) => void;
    onComplete?: () => void;
}

export default function PDFViewer({
    src,
    title,
    onProgress,
    onComplete
}: PDFViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [searchTerm, setSearchTerm] = useState('');
    const [bookmarks, setBookmarks] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load bookmarks from localStorage
        const savedBookmarks = localStorage.getItem(`pdf-bookmarks-${src}`);
        if (savedBookmarks) {
            setBookmarks(JSON.parse(savedBookmarks));
        }

        // Load last viewed page
        const savedPage = localStorage.getItem(`pdf-page-${src}`);
        if (savedPage) {
            setCurrentPage(parseInt(savedPage));
        }

        // Simulate loading
        setTimeout(() => {
            setTotalPages(10); // In real implementation, get from PDF
            setIsLoading(false);
        }, 1000);
    }, [src]);

    useEffect(() => {
        // Save current page
        localStorage.setItem(`pdf-page-${src}`, currentPage.toString());

        // Report progress
        const progress = (currentPage / totalPages) * 100;
        onProgress?.(progress);

        // Check if completed
        if (currentPage === totalPages) {
            onComplete?.();
        }
    }, [currentPage, totalPages, src, onProgress, onComplete]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleBookmark = () => {
        const newBookmarks = bookmarks.includes(currentPage)
            ? bookmarks.filter(b => b !== currentPage)
            : [...bookmarks, currentPage].sort((a, b) => a - b);

        setBookmarks(newBookmarks);
        localStorage.setItem(`pdf-bookmarks-${src}`, JSON.stringify(newBookmarks));
    };

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.max(50, Math.min(200, prev + delta)));
    };

    const handleSearch = () => {
        if (searchTerm) {
            console.log('Searching for:', searchTerm);
            // In real implementation, search within PDF content
            alert(`"${searchTerm}" için arama yapılacak`);
        }
    };

    const downloadPDF = () => {
        window.open(src, '_blank');
    };

    const printPDF = () => {
        const printWindow = window.open(src, '_blank');
        printWindow?.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">PDF yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Left: Title & Navigation */}
                    <div className="flex items-center gap-4">
                        {title && (
                            <h3 className="font-semibold text-gray-900 dark:text-white hidden sm:block">
                                {title}
                            </h3>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                    className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700"
                                />
                                <span className="text-gray-500 dark:text-gray-400 text-sm">
                                    / {totalPages}
                                </span>
                            </div>

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Center: Zoom & Search */}
                    <div className="flex items-center gap-4">
                        {/* Zoom */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleZoom(-10)}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-center">
                                {zoom}%
                            </span>
                            <button
                                onClick={() => handleZoom(10)}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="hidden sm:flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm w-32 dark:bg-gray-700"
                            />
                            <button
                                onClick={handleSearch}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Bookmark */}
                        <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${bookmarks.includes(currentPage) ? 'text-yellow-500' : 'text-gray-500'
                                }`}
                            title="Yer İmi"
                        >
                            <svg className="w-5 h-5" fill={bookmarks.includes(currentPage) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </button>

                        {/* Download */}
                        <button
                            onClick={downloadPDF}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="İndir"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>

                        {/* Print */}
                        <button
                            onClick={printPDF}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Yazdır"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Bookmarks Bar */}
                {bookmarks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Yer İmleri:</span>
                            {bookmarks.map(page => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`text-xs px-2 py-0.5 rounded ${page === currentPage
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    Sayfa {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* PDF Content */}
            <div
                ref={containerRef}
                className="h-[600px] overflow-auto bg-gray-200 dark:bg-gray-800 p-4"
            >
                <div
                    className="bg-white dark:bg-gray-700 shadow-lg mx-auto transition-transform"
                    style={{
                        width: `${zoom * 6}px`,
                        minHeight: `${zoom * 8}px`,
                        transform: `scale(${zoom / 100})`
                    }}
                >
                    {/* Embed PDF using iframe or object */}
                    <iframe
                        src={`${src}#page=${currentPage}`}
                        className="w-full h-[800px] border-0"
                        title={title || 'PDF Viewer'}
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">İlerleme:</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(currentPage / totalPages) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round((currentPage / totalPages) * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
