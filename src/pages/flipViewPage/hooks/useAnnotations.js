import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/flipbookConstants';

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
          `${process.env.BACKEND_BASE_URL}${API_ENDPOINTS.GET_ANNOTATIONS}`,
          {
            params: { pdf_id: pdfId },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response);
        const annotationsData = response.data?.data || [];
        const annotationMap = {};
        annotationMap[pdfId] = {};

        (annotationsData.annotations || []).forEach((pageEntry) => {
          const pageNum = pageEntry.page_number;

          if (!annotationMap[pdfId][pageNum]) {
            annotationMap[pdfId][pageNum] = [];
          }

          // Each shape in the API response has its own ID, type, and comments
          (pageEntry.shapes || []).forEach((shapeData) => {
            // Convert points from [{x,y}] format to flat array [x1, y1, x2, y2, ...]
            const normalizePoints = (pts) => {
              if (!pts || !Array.isArray(pts)) return null;
              return pts.flatMap(p => [p.x, p.y]);
            };

            const shape = {
              id: shapeData.id,
              type: shapeData.type === "highlight" ? "rect" : shapeData.type, // normalize "highlight" to "rect"
              x: shapeData.x,
              y: shapeData.y,
              width: shapeData.width,
              height: shapeData.height,
              points: shapeData.points ? normalizePoints(shapeData.points) : null,
              color: shapeData.color,
              strokeWidth: shapeData.stroke_width ?? shapeData.strokeWidth ?? 2,
              annotationId: pageEntry.id,
            };

            // Attach comments to this specific shape
            if (shapeData.comments && shapeData.comments.length > 0) {
              shape.comments = shapeData.comments.map(c => ({
                text: c.text ?? "",
                createdAt: c.created_at ?? Date.now(),
                id: c.id ?? undefined,
              }));
            }

            annotationMap[pdfId][pageNum].push(shape);
          });
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

      // We'll store final shapes array (comments attached to each shape)
      const shapes = [];

      // dedupe by id if present, otherwise by fingerprint
      const seenIds = new Set();
      const seenFP = new Set();

      // Track which IDs are from the server (already saved)
      const serverShapeIds = new Set();
      serverShapes.forEach((item) => {
        // Extract shape IDs from server annotations
        if (item.id) {
          serverShapeIds.add(item.id);
        }
        if (item.type === "group" && Array.isArray(item.highlights)) {
          item.highlights.forEach(h => {
            if (h.id) serverShapeIds.add(h.id);
          });
        }
      });

      // Helper: convert points from [x1,y1,x2,y2,...] to [{x,y},{x,y}]
      const convertPointsForAPI = (points) => {
        if (!points || !Array.isArray(points)) return null;
        const result = [];
        for (let i = 0; i < points.length; i += 2) {
          result.push({ x: points[i], y: points[i + 1] });
        }
        return result;
      };

      const addShape = (s, attachedComments = [], fromServer = false) => {
        if (!s) return;
        const id = s.id ?? s.tempId ?? null;
        
        // Don't add shapes that are from server (already saved)
        if (fromServer) return;
        
        if (id && serverShapeIds.has(id)) {
          // This shape is already on the server, skip it
          return;
        }
        
        if (id) {
          if (seenIds.has(id)) return;
          seenIds.add(id);
        } else {
          const fp = fingerprint(s);
          if (seenFP.has(fp)) return;
          seenFP.add(fp);
        }

        // Build shape object for API
        const shapeObj = {
          type: s.type,
          color: s.color,
          stroke_width: s.strokeWidth ?? s.stroke_width ?? 2,
        };

        if (s.type === "freehand" && s.points) {
          shapeObj.points = convertPointsForAPI(s.points);
        } else if (s.type === "rect" || s.type === "highlight") {
          shapeObj.x = s.x;
          shapeObj.y = s.y;
          shapeObj.width = s.width;
          shapeObj.height = s.height;
        }

        // Attach comments to this shape
        if (attachedComments.length > 0) {
          shapeObj.comments = attachedComments.map(c => ({
            text: c.text ?? ""
          }));
        }

        shapes.push(shapeObj);
      };

      // Helper to process an annotation item that might be:
      // - a normal shape (freehand/rect)
      // - a group { type: "group", highlights: [...], comments: [...] }
      const processAnnotationItem = (item, fromServer = false) => {
        if (!item) return;
        if (item.type === "group" && Array.isArray(item.highlights)) {
          // Group: attach comments to each highlight
          const groupComments = item.comments || [];
          item.highlights.forEach(h => addShape(h, groupComments, fromServer));
          return;
        }

        // normal single shape (might have comments attached)
        const shapeComments = item.comments || [];
        addShape(item, shapeComments, fromServer);
      };

      // Skip server shapes - they're already saved on the server
      // serverShapes.forEach((s) => processAnnotationItem(s, true)); // Commented out to prevent duplicate saves

      // process local (child-reported) annotations - these are NEW
      localAnnotations.forEach((a) => processAnnotationItem(a, false));

      // pending highlights (user-drawn but not grouped yet) — include them too
      pendingAnnotations.forEach((p) => {
        // if pending is a freehand/rect then it's a shape
        // if pending were group-like (unlikely) handle generically
        processAnnotationItem(p, false);
      });

      // If nothing to save for this page, skip
      if (shapes.length === 0) {
        continue;
      }

      const payload = {
        pdf_id: pdfId,
        page_number: pageNum,
        shapes,
      };

      try {
        await axios.post(
          `${process.env.BACKEND_BASE_URL}user/pdf-anotaion?action=store-anotation`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`Saved page ${pageNum}: shapes=${shapes.length}`);
      } catch (err) {
        console.error(`Failed to save annotations for page ${pageNum}`, err?.response?.data || err.message || err);
      }
    }

    alert("Save finished (attempted all pages).");
  };

  // Delete a single annotation from server
  const deleteAnnotation = async (highlightId) => {
    if (!highlightId || !pdfId) {
      console.warn("No highlight ID or pdfId — cannot delete");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.BACKEND_BASE_URL}user/pdf-anotaion?action=delete-annotation`,
        { highlight_id: highlightId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Deleted highlight ${highlightId}:`, response.data);
      return true;
    } catch (err) {
      console.error(`Failed to delete highlight ${highlightId}`, err?.response?.data || err.message || err);
      return false;
    }
  };

  // Update (store) comment against an existing highlight
  const updateHighlightComment = async (annotationId, highlightId, text) => {
    if (!annotationId || !highlightId || !text) {
      console.warn('Missing annotationId, highlightId, or text — cannot update comment');
      return false;
    }
    try {
      const response = await axios.post(
        `${process.env.BACKEND_BASE_URL}user/pdf-anotaion?action=update-store-coment`,
        { annotation_id: annotationId, highlight_id: highlightId, text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Updated comment mapping:', response.data);
      return true;
    } catch (err) {
      console.error('Failed to update comment mapping', err?.response?.data || err.message || err);
      return false;
    }
  };

  return {
    serverAnnotations,
    localAnnotationsByPage,
    handleAnnotationsChange,
    saveAnnotations,
    deleteAnnotation,
    updateHighlightComment
  };
};
