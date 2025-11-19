import { useState, useRef, useCallback, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

const DEFAULT_SCALE = 2.0;

const useOcr = ({ pdfProxyRef }) => {
  const [ocrResults, setOcrResults] = useState({});
  const [ocrProgress, setOcrProgress] = useState({});
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const workerRef = useRef(null);

  const ensureWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;
    try {
      const worker = await createWorker('eng');
      workerRef.current = worker;
      return worker;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      window.alert?.('Failed to initialize OCR. Please refresh the page.');
      return null;
    }
  }, []);

  const renderPageToCanvas = useCallback(async (pageNumber) => {
    if (!pdfProxyRef.current || !pageNumber) return null;
    const page = await pdfProxyRef.current.getPage(pageNumber);
    const viewport = page.getViewport({ scale: DEFAULT_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  }, [pdfProxyRef]);

  const recognizePage = useCallback(async (pageNumber) => {
    if (!pageNumber) return null;
    let progressInterval = null;
    try {
      setOcrProgress(prev => ({ ...prev, [pageNumber]: { progress: 0, status: 'Initializing...' } }));
      const worker = await ensureWorker();
      if (!worker) return null;

      setOcrProgress(prev => ({ ...prev, [pageNumber]: { progress: 15, status: 'Rendering page...' } }));
      const canvas = await renderPageToCanvas(pageNumber);
      if (!canvas) throw new Error('Unable to render page for OCR.');

      setOcrProgress(prev => ({ ...prev, [pageNumber]: { progress: 30, status: 'Running OCR...' } }));
      const imageData = canvas.toDataURL('image/png');

      const startTime = Date.now();
      const estimatedDuration = 5000;
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const simulated = Math.min(30 + (elapsed / estimatedDuration) * 60, 90);
        setOcrProgress(prev => ({
          ...prev,
          [pageNumber]: { progress: Math.round(simulated), status: 'Recognizing text...' },
        }));
      }, 200);

      const { data: { text, confidence } } = await worker.recognize(imageData);
      const trimmed = text.trim();
      setOcrResults(prev => ({
        ...prev,
        [pageNumber]: { text: trimmed, confidence: Math.round(confidence) },
      }));
      setOcrProgress(prev => ({ ...prev, [pageNumber]: { progress: 100, status: 'Complete' } }));
      return { text: trimmed, confidence };
    } catch (error) {
      console.error(`OCR error on page ${pageNumber}:`, error);
      setOcrProgress(prev => ({ ...prev, [pageNumber]: { progress: 0, status: `Error: ${error.message}` } }));
      return null;
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setTimeout(() => {
        setOcrProgress(prev => {
          const copy = { ...prev };
          delete copy[pageNumber];
          return copy;
        });
      }, 2000);
    }
  }, [ensureWorker, renderPageToCanvas]);

  const runOcrOnPage = useCallback(async (pageNumber) => {
    if (!pageNumber || isOcrRunning) return null;
    setIsOcrRunning(true);
    const result = await recognizePage(pageNumber);
    setIsOcrRunning(false);
    return result;
  }, [isOcrRunning, recognizePage]);

  const runOcrOnAllPages = useCallback(async () => {
    if (!pdfProxyRef.current || isOcrRunning) return 0;
    setIsOcrRunning(true);
    const totalPages = pdfProxyRef.current.numPages || 0;
    for (let i = 1; i <= totalPages; i += 1) {
      await recognizePage(i);
    }
    setIsOcrRunning(false);
    return totalPages;
  }, [isOcrRunning, pdfProxyRef, recognizePage]);

  const extractTextFromArea = useCallback(async (clipRect, pageNumber) => {
    if (!clipRect || !pageNumber) return null;
    const progressKey = `clip-${pageNumber}`;
    try {
      setOcrProgress(prev => ({ ...prev, [progressKey]: { progress: 0, status: 'Extracting text...' } }));
      const worker = await ensureWorker();
      if (!worker) return null;

      const canvas = await renderPageToCanvas(pageNumber);
      if (!canvas) throw new Error('Unable to render page for OCR.');

      const cropX = clipRect.x * canvas.width;
      const cropY = clipRect.y * canvas.height;
      const cropWidth = clipRect.width * canvas.width;
      const cropHeight = clipRect.height * canvas.height;

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedContext = croppedCanvas.getContext('2d');
      croppedContext.drawImage(
        canvas,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight,
      );

      const { data: { text, confidence } } = await worker.recognize(croppedCanvas.toDataURL('image/png'));
      const trimmed = text.trim();
      setOcrProgress(prev => {
        const copy = { ...prev };
        delete copy[progressKey];
        return copy;
      });
      if (!trimmed) return null;
      return { text: trimmed, confidence: Math.round(confidence) };
    } catch (error) {
      console.error('Error extracting text from area:', error);
      setOcrProgress(prev => ({ ...prev, [progressKey]: { progress: 0, status: `Error: ${error.message}` } }));
      return null;
    }
  }, [ensureWorker, renderPageToCanvas]);

  useEffect(() => () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    ocrResults,
    ocrProgress,
    isOcrRunning,
    runOcrOnPage,
    runOcrOnAllPages,
    extractTextFromArea,
  };
};

export default useOcr;

