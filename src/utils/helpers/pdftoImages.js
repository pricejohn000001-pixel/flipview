import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function PDFtoImages({ pdfFile, onPagesReady }) {
  const [numPages, setNumPages] = useState(null);

  const handleLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Convert each page canvas to image Data URL
  const renderPages = () => {
    const promises = [];
    for (let i = 1; i <= numPages; i++) {
      promises.push(
        new Promise((resolve) => {
          const canvas = document.createElement("canvas");
          const scale = 1.5;

          // Render page to hidden canvas to get image data
          const renderPage = async () => {
            const loadingTask = pdfjs.getDocument(pdfFile);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(i);

            const viewport = page.getViewport({ scale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            await page.render(renderContext).promise;
            const imgData = canvas.toDataURL();
            resolve(imgData);
          };

          renderPage();
        })
      );
    }
    Promise.all(promises).then((images) => {
      onPagesReady(images);
    });
  };

  useEffect(() => {
    if (numPages) {
      renderPages();
    }
  }, [numPages]);

  return <Document file={pdfFile} onLoadSuccess={handleLoadSuccess} />;
}

export default PDFtoImages;
