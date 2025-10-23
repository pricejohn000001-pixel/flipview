import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing annotations
 * Handles server annotations fetching, local annotations state, and saving
 */
export const useAnnotations = (pdfId, token) => {
  const [serverAnnotations, setServerAnnotations] = useState({});
  const [localAnnotationsByPage, setLocalAnnotationsByPage] = useState({});

  // Fetch annotations from server
  useEffect(() => {
    if (!pdfId) return;

    const fetchAnnotations = async () => {
      try {
        const response = await axios.get(
          `${process.env.BACKEND_BASE_URL}user/pdf-anotaion?action=get-annotations`,
          {
            params: { pdf_id: pdfId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const annotationsData = response.data?.data || [];
        const annotationMap = {};
        annotationMap[pdfId] = {};

        (annotationsData.annotations || []).forEach((pageEntry) => {
          const pageNum = pageEntry.page_number;

          // normalize shapes (if backend uses stroke_width, etc.)
          const shapes = (pageEntry.shapes || []).map((s) => ({
            ...s,
            strokeWidth: s.stroke_width ?? s.strokeWidth ?? 2,
          }));

          // if backend returns comments array for that page, make a group object
          const comments = pageEntry.comments || pageEntry.comments_list || [];

          if (comments.length > 0) {
            // create a single group containing the shapes + comments
            annotationMap[pdfId][pageNum] = [
              {
                type: "group",
                highlights: shapes,
                comments: comments.map(c => ({
                  text: c.text ?? c.comment ?? "",
                  createdAt: c.created_at ?? c.createdAt ?? Date.now(),
                  // include any id/link from backend, if present:
                  id: c.id ?? c.comment_id ?? undefined,
                })),
              },
            ];
          } else {
            // just the flat shapes
            annotationMap[pdfId][pageNum] = shapes;
          }
        });

        console.log("Fetched server annotations:", annotationMap);
        setServerAnnotations(annotationMap);
      } catch (err) {
        console.error("Failed to load annotations:", err);
      }
    };

    fetchAnnotations();
  }, [pdfId, token]);

  // Handle annotations change from child components
  const handleAnnotationsChange = useCallback((pageNum, anns = [], pending = []) => {
    setLocalAnnotationsByPage(prev => {
      const prevEntry = prev[pageNum] || { annotations: [], pending: [] };
      if (JSON.stringify(prevEntry.annotations) === JSON.stringify(anns)
          && JSON.stringify(prevEntry.pending) === JSON.stringify(pending)) {
        return prev;
      }
      return {
        ...prev,
        [pageNum]: { annotations: anns, pending }
      };
    });
  }, []);

  // Save annotations to server
  const saveAnnotations = async (pageImages, totalPages) => {
    if (!pdfId) {
      console.warn("No pdfId — cannot save");
      return;
    }

    const pagesCount = pageImages.length || totalPages || 0;
    if (pagesCount === 0) {
      alert("No pages to save.");
      return;
    }

    // helper: create simple fingerprint for shapes that lack id
    const fingerprint = (s) => {
      try {
        // safe stable fingerprint - uses type + JSON of points/rect coords & color/width
        if (!s) return "";
        if (s.type === "freehand") {
          return `fh:${(s.points || []).join(',')}:${s.color || ''}:${s.strokeWidth || ''}`;
        }
        // rect-like
        return `rect:${s.x || 0}:${s.y || 0}:${s.width || 0}:${s.height || 0}:${s.color || ''}`;
      } catch {
        return JSON.stringify(s || {});
      }
    };

    for (let pageNum = 1; pageNum <= pagesCount; pageNum++) {
      // server shapes (normalized earlier when you set serverAnnotations)
      const serverShapes = (serverAnnotations?.[pdfId]?.[pageNum]) || [];

      // local shapes reported by AnnotatablePage(s)
      const localEntry = localAnnotationsByPage[pageNum] || { annotations: [], pending: [] };
      const localAnnotations = localEntry.annotations || [];
      const pendingAnnotations = localEntry.pending || [];

      // We'll store final shapes array and comments array
      const shapes = [];
      const comments = [];

      // dedupe by id if present, otherwise by fingerprint
      const seenIds = new Set();
      const seenFP = new Set();

      const addShape = (s) => {
        if (!s) return;
        const id = s.id ?? s.tempId ?? null;
        if (id) {
          if (seenIds.has(id)) return;
          seenIds.add(id);
          shapes.push(s);
          return;
        }
        const fp = fingerprint(s);
        if (seenFP.has(fp)) return;
        seenFP.add(fp);
        shapes.push(s);
      };

      // Helper to process an annotation item that might be:
      // - a normal shape (freehand/rect)
      // - a group { type: "group", highlights: [...], comments: [...] }
      const processAnnotationItem = (item) => {
        if (!item) return;
        if (item.type === "group" && Array.isArray(item.highlights)) {
          item.highlights.forEach(h => addShape(h));
          // collect comments if present
          if (Array.isArray(item.comments)) {
            item.comments.forEach(c => {
              if (!c) return;
              // normalize comment object: { text, createdAt, ... }
              comments.push({
                text: c.text ?? "",
                created_at: c.createdAt ?? c.created_at ?? Date.now()
              });
            });
          }
          return;
        }

        // normal single shape (might also contain comments on top-level)
        addShape(item);
        if (item.comments && Array.isArray(item.comments)) {
          item.comments.forEach(c => {
            if (!c) return;
            comments.push({
              text: c.text ?? "",
              created_at: c.createdAt ?? c.created_at ?? Date.now()
            });
          });
        }
      };

      // process server shapes: they are likely already "flat" shapes (not groups)
      serverShapes.forEach((s) => processAnnotationItem(s));

      // process local (child-reported) annotations
      localAnnotations.forEach((a) => processAnnotationItem(a));

      // pending highlights (user-drawn but not grouped yet) — include them too
      pendingAnnotations.forEach((p) => {
        // if pending is a freehand/rect then it's a shape
        // if pending were group-like (unlikely) handle generically
        processAnnotationItem(p);
      });

      // If nothing to save for this page, skip
      if (shapes.length === 0 && comments.length === 0) {
        continue;
      }

      const payload = {
        pdf_id: pdfId,
        page_number: pageNum,
        shapes,
        comments,
      };

      try {
        await axios.post(
          `${process.env.BACKEND_BASE_URL}user/pdf-anotaion?action=store-anotation`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`Saved page ${pageNum}: shapes=${shapes.length} comments=${comments.length}`);
      } catch (err) {
        console.error(`Failed to save annotations for page ${pageNum}`, err?.response?.data || err.message || err);
      }
    }

    alert("Save finished (attempted all pages).");
  };

  return {
    serverAnnotations,
    localAnnotationsByPage,
    handleAnnotationsChange,
    saveAnnotations
  };
};
