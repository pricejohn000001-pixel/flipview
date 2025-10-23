import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for handling PDF loading and rendering
 * Manages PDF.js worker loading, page rendering, and error handling
 */
export const usePDFLoader = (pdfUrl) => {
  const [pageImages, setPageImages] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfWorkerLoaded, setPdfWorkerLoaded] = useState(false);
  const [pageAspectRatio, setPageAspectRatio] = useState(8.5/11);
  
  const pdfRef = useRef(null);

  // PDF.js worker loader
  useEffect(() => {
    const loadPdfWorker = () => {
      return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
          setPdfWorkerLoaded(true);
          resolve(window.pdfjsLib);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          if (window.pdfjsLib) {
            try {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              setPdfWorkerLoaded(true);
              resolve(window.pdfjsLib);
            } catch (err) {
              console.error('Error configuring PDF.js worker:', err);
              reject(err);
            }
          } else {
            reject(new Error('PDF.js failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js script'));
        document.head.appendChild(script);
      });
    };

    if (pdfUrl && !pdfWorkerLoaded) {
      loadPdfWorker().catch(err => {
        console.error('PDF.js loading error:', err);
        setError('Failed to load PDF viewer');
      });
    }
  }, [pdfUrl, pdfWorkerLoaded]);

  // Helper: render single PDF page to data URL
  const renderPDFPage = async (page, scale = 1.5) => {
    try {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
      return {
        dataUrl: canvas.toDataURL('image/png'),
        aspectRatio: viewport.width / viewport.height
      };
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      throw err;
    }
  };

  // Load and render the PDF (batch rendering)
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfWorkerLoaded || !window.pdfjsLib) return;
      if (!pdfUrl) return;

      try {
        setLoading(true);
        setError(null);
        setPageImages([]);
        setThumbnails([]);
        setTotalPages(0);

        const loadingTask = window.pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);

        // Get first page to determine aspect ratio
        if (pdf.numPages > 0) {
          const firstPage = await pdf.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1 });
          const aspectRatio = viewport.width / viewport.height;
          setPageAspectRatio(aspectRatio);
        }

        // Batch size to reduce memory pressure
        const batchSize = 5;
        const renderedPages = [];
        const renderedThumbnails = [];

        for (let i = 0; i < pdf.numPages; i += batchSize) {
          const pagePromises = [];
          const thumbnailPromises = [];

          for (let j = i; j < Math.min(i + batchSize, pdf.numPages); j++) {
            const pageNum = j + 1;
            try {
              const page = await pdf.getPage(pageNum);
              // render full page and thumbnail in parallel for this page
              pagePromises.push(renderPDFPage(page, 1.5).then(result => result.dataUrl));
              thumbnailPromises.push(renderPDFPage(page, 0.35).then(result => result.dataUrl));
            } catch (pageErr) {
              console.error(`Error loading page ${pageNum}`, pageErr);
              // placeholder fallback images (small SVG)
              const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGxvYWRpbmcgcGFnZTwvdGV4dD4KPC9zdmc+';
              pagePromises.push(Promise.resolve(placeholder));
              thumbnailPromises.push(Promise.resolve(placeholder));
            }
          }

          const [batchPages, batchThumbs] = await Promise.all([
            Promise.all(pagePromises),
            Promise.all(thumbnailPromises),
          ]);

          renderedPages.push(...batchPages);
          renderedThumbnails.push(...batchThumbs);
        }

        setPageImages(renderedPages);
        setThumbnails(renderedThumbnails);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err?.message || err}`);
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl, pdfWorkerLoaded]);

  return {
    pageImages,
    thumbnails,
    loading,
    error,
    totalPages,
    pdfWorkerLoaded,
    pageAspectRatio,
    pdfRef: pdfRef.current
  };
};
