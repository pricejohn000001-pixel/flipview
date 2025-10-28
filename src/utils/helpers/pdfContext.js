import React, { createContext, useContext, useState, useEffect } from "react";

const PdfContext = createContext();

export const PdfProvider = ({ children }) => {
  const [pdfUrl, setPdfUrl] = useState(() => sessionStorage.getItem("pdfUrl") || null);
  const [pdfId, setPdfId] = useState(() => sessionStorage.getItem("pdfId") || null);

  const setPdfData = (url, id) => {
    setPdfUrl(url);
    setPdfId(id);
    sessionStorage.setItem("pdfUrl", url);
    sessionStorage.setItem("pdfId", id);
  };

  // Optional: clear sessionStorage on unmount (if needed)
  useEffect(() => {
    return () => {
      // sessionStorage.removeItem("pdfUrl");
      // sessionStorage.removeItem("pdfId");
    };
  }, []);

  return (
    <PdfContext.Provider value={{ pdfUrl, pdfId, setPdfData }}>
      {children}
    </PdfContext.Provider>
  );
};

export const usePdf = () => useContext(PdfContext);
