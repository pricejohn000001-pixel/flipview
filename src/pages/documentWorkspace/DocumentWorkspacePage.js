import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  MdBrush,
  MdComment,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdHighlight,
  MdViewSidebar,
  MdFormatColorFill,
  MdBookmarkAdd,
  MdBookmark,
  MdChevronLeft,
  MdChevronRight,
  MdContentCut,
} from 'react-icons/md';
import demoPdf from '../../assets/demmo.pdf';
import styles from './documentWorkspace.module.css';
import useOcr from './hooks/useOcr';
import FloatingToolbar from './components/FloatingToolbar';
import ClippingsPanel from './components/ClippingsPanel';
import SearchPanel from './components/SearchPanel';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.93/pdf.worker.min.mjs`;

// ---------- constants ----------
const TOOL_TYPES = [
  { id: 'select', label: 'Select', icon: MdViewSidebar },
  { id: 'highlight', label: 'Area Highlight', icon: MdHighlight },
  { id: 'textHighlight', label: 'Text Highlight', icon: MdFormatColorFill },
  { id: 'underline', label: 'Underline', icon: MdFormatUnderlined },
  { id: 'strike', label: 'Strike-through', icon: MdFormatStrikethrough },
  { id: 'freehand', label: 'Freehand', icon: MdBrush },
  { id: 'comment', label: 'Note', icon: MdComment },
  { id: 'bookmark', label: 'Bookmark', icon: MdBookmarkAdd },
  { id: 'clip', label: 'Clip Area', icon: MdContentCut },
];

const ANNOTATION_TYPES = ['highlight', 'underline', 'strike', 'freehand', 'comment'];
const COLOR_OPTIONS = ['#fbbf24', '#f97316', '#a855f7', '#22c55e', '#3b82f6', '#ef4444'];
const BOOKMARK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const DEFAULT_BOOKMARK_COLOR = BOOKMARK_COLORS[0];

// ---------- utils ----------
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const createAnnotationId = (() => {
  let counter = 0;
  return () => `ann-${Date.now()}-${++counter}`;
})();
const createClippingId = (() => {
  let counter = 0;
  return () => `clip-${Date.now()}-${++counter}`;
})();
const createBookmarkId = (() => {
  let counter = 0;
  return () => `bm-${Date.now()}-${++counter}`;
})();
const getPrimaryPageFromSource = (source) => {
  const [first] = String(source).split(',');
  const parsed = parseInt(first, 10);
  return Number.isFinite(parsed) ? parsed : 1;
};

const getNormalizedPoint = (event, element) => {
  const rect = element.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return { x, y };
};

// ---------- component ----------
const DocumentWorkspacePage = () => {
  // Core PDF state
  const [numPages, setNumPages] = useState(null);
  const [primaryPage, setPrimaryPage] = useState(1);
  const [primaryScale, setPrimaryScale] = useState(1.15);

  // base annotation/bookmark state (your existing features)
  const [annotations, setAnnotations] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [annotationFilters, setAnnotationFilters] = useState(() => ANNOTATION_TYPES.reduce((acc, type) => ({ ...acc, [type]: true }), {}));
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState(COLOR_OPTIONS[0]);
  const [activeBookmarkColor, setActiveBookmarkColor] = useState(DEFAULT_BOOKMARK_COLOR);

  // drawing / clippings / search
  const [drawingState, setDrawingState] = useState(null);
  const [clippings, setClippings] = useState([]); // each clipping: { id, content, createdAt, sourcePage, sourceRect? {x,y,width,height} (normalized) }
  const [selectedClippings, setSelectedClippings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // workspace items for LiquidText-like canvas
  // each: { id, clippingId, x, y } where x,y are normalized relative to viewerCanvas (0..1)
  const [workspaceItems, setWorkspaceItems] = useState([]);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // refs
  const pdfProxyRef = useRef(null);
  const overlayRefs = useRef({ primary: null });
  const viewerCanvasRef = useRef(null);
  const viewerZoomWrapperRef = useRef(null);
  const viewerDeckRef = useRef(null);

  const {
    ocrResults,
    ocrProgress,
    isOcrRunning,
    runOcrOnPage,
    runOcrOnAllPages,
    extractTextFromArea,
  } = useOcr({ pdfProxyRef });

  const handleExtractClipFromArea = useCallback((clipRect, pageNumber) => {
    extractTextFromArea(clipRect, pageNumber).then((result) => {
      if (!result) return;
      const newClip = {
        id: createClippingId(),
        content: result.text,
        createdAt: new Date().toISOString(),
        sourcePage: pageNumber,
        sourceRect: clipRect,
        confidence: result.confidence,
        source: 'OCR',
      };
      setClippings((prev) => [newClip, ...prev]);
      setSelectedClippings([]);
      setActiveTool('select');
    });
  }, [extractTextFromArea]);

  const draggingAnnotationId = useRef(null);
  const draggingAnnotationMetaRef = useRef({ offsetX: 0, offsetY: 0, pageNumber: 1 });
  const draggingBookmarkId = useRef(null);
  const draggingBookmarkMetaRef = useRef({ offsetX: 0, offsetY: 0 });

  const currentSelectionRef = useRef({ text: '', range: null });

  // workspace drag/move refs
  const draggingWorkspaceItemId = useRef(null);
  const draggingWorkspaceMetaRef = useRef({ offsetX: 0, offsetY: 0 });

  // ---------- selection capture ----------
  useEffect(() => {
    const captureSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) {
        currentSelectionRef.current = { text: '', range: null };
        return;
      }
      const range = sel.getRangeAt(0);
      currentSelectionRef.current = {
        text: sel.toString().trim(),
        range: range.cloneRange(),
      };
    };
    document.addEventListener('selectionchange', captureSelection);
    document.addEventListener('mousedown', captureSelection);
    document.addEventListener('touchstart', captureSelection);
    return () => {
      document.removeEventListener('selectionchange', captureSelection);
      document.removeEventListener('mousedown', captureSelection);
      document.removeEventListener('touchstart', captureSelection);
    };
  }, []);

  // ---------- PDF load ----------
  const onDocumentLoadSuccess = useCallback((pdfInstance) => {
    setNumPages(pdfInstance.numPages);
    pdfProxyRef.current = pdfInstance;
  }, []);

  // ---------- annotation helpers ----------
  const toggleAnnotationFilter = useCallback((type) => {
    setAnnotationFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const filteredAnnotations = useMemo(
    () => annotations.filter((a) => annotationFilters[a.type]),
    [annotations, annotationFilters]
  );

  const updateAnnotations = useCallback((updater) => {
    setAnnotations((prev) => updater(prev).sort((a, b) => a.pageNumber - b.pageNumber));
  }, []);

  // ---------- apply text annotations (unchanged) ----------
  const applyLineAnnotation = useCallback((type) => {
    const overlay = overlayRefs.current.primary;
    if (!overlay) return;
    const stored = currentSelectionRef.current;
    const hasSelection = !!stored.text && stored.range;

    if (type === 'comment') {
      let x, y, linkedText = '';
      if (hasSelection) {
        const rect = stored.range.getClientRects()[0];
        if (!rect) return;
        const canvasRect = overlay.getBoundingClientRect();
        x = (rect.left + rect.width / 2 - canvasRect.left) / canvasRect.width;
        y = (rect.top + rect.height / 2 - canvasRect.top) / canvasRect.height;
        linkedText = stored.text;
      } else {
        const p = getNormalizedPoint({ clientX: overlay._lastX || 0, clientY: overlay._lastY || 0 }, overlay);
        x = p.x;
        y = p.y;
      }
      const content = window.prompt('Add note', linkedText || '');
      if (!content) return;
      updateAnnotations((prev) => [
        ...prev,
        {
          id: createAnnotationId(),
          type: 'comment',
          pageNumber: primaryPage,
          color: activeColor,
          createdAt: new Date().toISOString(),
          content,
          linkedText: linkedText || null,
          position: { x: clamp(x, 0.05, 0.95), y: clamp(y, 0.05, 0.95) },
        },
      ]);
      currentSelectionRef.current = { text: '', range: null };
      window.getSelection().removeAllRanges();
      return;
    }

    if (!hasSelection) {
      window.alert('Please select some text first.');
      return;
    }

    const clientRects = Array.from(stored.range.getClientRects()).filter(
      (r) => r.width >= 2 && r.height >= 2,
    );
    if (clientRects.length === 0) return;
    const canvasRect = overlay.getBoundingClientRect();

    if (type === 'textHighlight') {
      const rects = clientRects.map((rect) => ({
        x: (rect.left - canvasRect.left) / canvasRect.width,
        y: (rect.top - canvasRect.top) / canvasRect.height,
        width: rect.width / canvasRect.width,
        height: rect.height / canvasRect.height,
      }));
      updateAnnotations((prev) => [
        ...prev,
        {
          id: createAnnotationId(),
          type: 'highlight',
          subtype: 'text',
          pageNumber: primaryPage,
          color: activeColor,
          createdAt: new Date().toISOString(),
          text: stored.text,
          rects,
        },
      ]);
    }
    if (type === 'underline' || type === 'strike') {
      const lines = clientRects.map((rect) => {
        const x = (rect.left - canvasRect.left) / canvasRect.width;
        const y = (rect.top - canvasRect.top) / canvasRect.height;
        const width = rect.width / canvasRect.width;
        const height = rect.height / canvasRect.height;
        const lineY = type === 'underline' ? y + height * 0.9 : y + height * 0.5;
        return { x1: x, y1: lineY, x2: x + width, y2: lineY };
      });
      updateAnnotations((prev) => [
        ...prev,
        {
          id: createAnnotationId(),
          type,
          pageNumber: primaryPage,
          color: activeColor,
          createdAt: new Date().toISOString(),
          lines,
          text: stored.text,
        },
      ]);
    }
    currentSelectionRef.current = { text: '', range: null };
    window.getSelection().removeAllRanges();
  }, [activeColor, primaryPage, updateAnnotations]);

  // ---------- drawing finalize ----------
  const finalizeDrawing = useCallback((endPoint, overlayKey) => {
    if (!drawingState) return;
    const { type, start, points, pageNumber } = drawingState;
    
    // Handle clipping area selection
    if (type === 'clip') {
      const w = Math.abs(endPoint.x - start.x);
      const h = Math.abs(endPoint.y - start.y);
      if (w < 0.01 || h < 0.01) { 
        setDrawingState(null);
        return;
      }
      const clipRect = {
        x: Math.min(start.x, endPoint.x),
        y: Math.min(start.y, endPoint.y),
        width: w,
        height: h,
      };
      setDrawingState(null);
      // Trigger OCR extraction for this area
      handleExtractClipFromArea(clipRect, pageNumber);
      return;
    }
    
    if (!type || !['highlight', 'freehand'].includes(type)) {
      setDrawingState(null);
      return;
    }
    const base = { id: createAnnotationId(), type, pageNumber, color: activeColor, createdAt: new Date().toISOString() };
    let annotation = null;
    if (type === 'highlight') {
      const w = Math.abs(endPoint.x - start.x);
      const h = Math.abs(endPoint.y - start.y);
      if (w < 0.01 || h < 0.01) { setDrawingState(null); return; }
      annotation = { ...base, subtype: 'area', position: { x: Math.min(start.x, endPoint.x), y: Math.min(start.y, endPoint.y), width: w, height: h } };
    } else if (type === 'freehand') {
      const merged = [...points, endPoint];
      if (merged.length < 3) { setDrawingState(null); return; }
      annotation = { ...base, points: merged };
    }
    if (annotation) updateAnnotations((prev) => [...prev, annotation]);
    setDrawingState(null);
  }, [drawingState, updateAnnotations, activeColor, handleExtractClipFromArea]);

  // ---------- BOOKMARK TOOL ----------
  const addBookmark = useCallback((event, pageNumber, overlayKey) => {
    const overlay = overlayRefs.current[overlayKey];
    if (!overlay) return;

    const point = getNormalizedPoint(event, overlay);
    const note = window.prompt('Bookmark note (optional)', '')?.trim();

    const newBookmark = {
      id: createBookmarkId(),
      pageNumber,
      position: { x: clamp(point.x, 0.05, 0.95), y: clamp(point.y, 0.1, 0.9) },
      color: activeBookmarkColor,
      note: note || null,
      createdAt: new Date().toISOString(),
    };

    setBookmarks(prev => [...prev, newBookmark]);
    setActiveTool('select'); // auto return to select tool
  }, [activeBookmarkColor]);

  // ---------- POINTER EVENTS (main overlay) ----------
  const handlePointerDown = useCallback((event, pageNumber, overlayKey) => {
    const overlay = overlayRefs.current[overlayKey];
    if (!overlay) return;

    overlay._lastX = event.clientX;
    overlay._lastY = event.clientY;

    // bookmark creation
    if (activeTool === 'bookmark') {
      event.preventDefault();
      addBookmark(event, pageNumber, overlayKey);
      return;
    }

    // drawing tools and clipping
    if (['highlight', 'freehand', 'clip'].includes(activeTool)) {
      event.preventDefault();
      const p = getNormalizedPoint(event, overlay);
      setDrawingState({
        type: activeTool,
        pageNumber,
        overlayKey,
        ...(activeTool === 'freehand' ? { points: [p] } : { start: p }),
      });
      return;
    }

    // comment tool
    if (activeTool === 'comment') {
      applyLineAnnotation('comment');
      return;
    }
  }, [activeTool, addBookmark, applyLineAnnotation]);

  const handlePointerMove = useCallback((event, overlayKey) => {
    const overlay = overlayRefs.current[overlayKey];
    if (!overlay) return;

    // dragging comment note
    if (draggingAnnotationId.current) {
      event.preventDefault();
      const p = getNormalizedPoint(event, overlay);
      const { offsetX, offsetY, pageNumber } = draggingAnnotationMetaRef.current;
      updateAnnotations((prev) =>
        prev.map((a) =>
          a.id === draggingAnnotationId.current && a.pageNumber === pageNumber && a.type === 'comment'
            ? { ...a, position: { x: clamp(p.x - offsetX, 0.02, 0.92), y: clamp(p.y - offsetY, 0.02, 0.92) } }
            : a,
        ),
      );
      return;
    }

    // dragging bookmark
    if (draggingBookmarkId.current) {
      event.preventDefault();
      const p = getNormalizedPoint(event, overlay);
      const { offsetX, offsetY } = draggingBookmarkMetaRef.current;
      setBookmarks(prev =>
        prev.map(bm =>
          bm.id === draggingBookmarkId.current
            ? {
                ...bm,
                position: {
                  x: clamp(p.x - offsetX, 0.05, 0.95),
                  y: clamp(p.y - offsetY, 0.05, 0.95),
                },
              }
            : bm
        )
      );
      return;
    }

    // drawing moves
    if (!drawingState || drawingState.overlayKey !== overlayKey) return;
    const p = getNormalizedPoint(event, overlay);
    if (drawingState.type === 'freehand') {
      setDrawingState((prev) => ({ ...prev, points: [...prev.points, p], lastPoint: p }));
    } else if (drawingState.type === 'highlight' || drawingState.type === 'clip') {
      setDrawingState((prev) => ({ ...prev, lastPoint: p }));
    }
  }, [drawingState, updateAnnotations]);

  const handlePointerUp = useCallback((event, overlayKey) => {
    const overlay = overlayRefs.current[overlayKey];
    if (!overlay) {
      setDrawingState(null);
      draggingAnnotationId.current = null;
      draggingBookmarkId.current = null;
      return;
    }

    if (draggingAnnotationId.current) { draggingAnnotationId.current = null; return; }
    if (draggingBookmarkId.current) { draggingBookmarkId.current = null; return; }
    if (!drawingState || drawingState.overlayKey !== overlayKey) { setDrawingState(null); return; }

    finalizeDrawing(getNormalizedPoint(event, overlay), overlayKey);
  }, [drawingState, finalizeDrawing]);

  // ---------- DRAG START handlers for notes/bookmarks ----------
  const handleStartDraggingNote = useCallback((event, annotation) => {
    if (activeTool !== 'select') return;
    event.stopPropagation();
    const overlay = event.currentTarget.closest('[data-overlay]');
    if (!overlay) return;
    const p = getNormalizedPoint(event, overlay);
    draggingAnnotationMetaRef.current = {
      offsetX: p.x - annotation.position.x,
      offsetY: p.y - annotation.position.y,
      pageNumber: annotation.pageNumber,
    };
    draggingAnnotationId.current = annotation.id;
  }, [activeTool]);

  const handleStartDraggingBookmark = useCallback((event, bookmark) => {
    if (activeTool !== 'select') return;
    event.stopPropagation();
    const overlay = event.currentTarget.closest('[data-overlay]');
    if (!overlay) return;
    const p = getNormalizedPoint(event, overlay);
    draggingBookmarkMetaRef.current = {
      offsetX: p.x - bookmark.position.x,
      offsetY: p.y - bookmark.position.y,
    };
    draggingBookmarkId.current = bookmark.id;
  }, [activeTool]);

  // ---------- clipboard/clipping logic (captures source rect) ----------
  const handleClipSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    
    // If no text selected, try to use OCR results for the current page
    if (!text) {
      if (ocrResults[primaryPage] && ocrResults[primaryPage].text) {
        const ocrText = ocrResults[primaryPage].text;
        const confirmed = window.confirm(
          `No text selected. Use OCR result for this page?\n\n` +
          `(First ${Math.min(100, ocrText.length)} characters: ${ocrText.substring(0, 100)}...)`
        );
        if (confirmed) {
          const newClip = {
            id: createClippingId(),
            content: ocrText,
            createdAt: new Date().toISOString(),
            sourcePage: primaryPage,
            sourceRect: null,
            source: 'OCR',
          };
          setClippings((prev) => [newClip, ...prev]);
          setSelectedClippings([]);
          return;
        }
      }
      window.alert('Select text to clip, or use the Clip Area tool for scanned documents.');
      return;
    }

    // compute source rect normalized relative to overlay (if range exists)
    let sourceRect = null;
    const stored = currentSelectionRef.current;
    const overlay = overlayRefs.current.primary;
    if (stored?.range && overlay) {
      const rect = stored.range.getClientRects()[0];
      if (rect) {
        const canvasRect = overlay.getBoundingClientRect();
        sourceRect = {
          x: (rect.left - canvasRect.left) / canvasRect.width,
          y: (rect.top - canvasRect.top) / canvasRect.height,
          width: rect.width / canvasRect.width,
          height: rect.height / canvasRect.height,
        };
      }
    }

    const newClip = {
      id: createClippingId(),
      content: text,
      createdAt: new Date().toISOString(),
      sourcePage: primaryPage,
      sourceRect, // may be null if selection couldn't be measured
      source: 'PDF',
    };

    setClippings((prev) => [newClip, ...prev]);
    setSelectedClippings([]);
    sel.removeAllRanges();
  }, [primaryPage, ocrResults]);

  const toggleClippingSelection = useCallback((id) => {
    setSelectedClippings((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleReorderClipping = useCallback((id, dir) => {
    setClippings((prev) => {
      const i = prev.findIndex(c => c.id === id);
      if (i === -1) return prev;
      const swap = clamp(i + dir, 0, prev.length - 1);
      const copy = [...prev];
      [copy[i], copy[swap]] = [copy[swap], copy[i]];
      return copy;
    });
  }, []);

  const handleCombineClippings = useCallback(() => {
    if (selectedClippings.length < 2) return;
    setClippings((prev) => {
      const selected = prev.filter(c => selectedClippings.includes(c.id));
      if (selected.length < 2) return prev;
      const segments = selected.map((clip, idx) => ({
        id: clip.id,
        label: `Segment ${idx + 1}`,
        content: clip.content,
        sourcePage: clip.sourcePage,
        sourceRect: clip.sourceRect,
      }));
      const combined = {
        id: createClippingId(),
        content: segments.map(seg => `${seg.label}: ${seg.content}`).join('\n'),
        createdAt: new Date().toISOString(),
        sourcePage: segments.map(seg => seg.sourcePage).join(', '),
        sourceRect: segments[0]?.sourceRect || null,
        segments,
        type: 'combined',
      };
      return [combined, ...prev.filter(c => !selectedClippings.includes(c.id))];
    });
    setWorkspaceItems(prev => prev.filter(it => !selectedClippings.includes(it.clippingId)));
    setSelectedClippings([]);
  }, [selectedClippings]);

  const handleOcrCurrentPage = useCallback(() => {
    runOcrOnPage(primaryPage);
  }, [primaryPage, runOcrOnPage]);

  const handleOcrAllPages = useCallback(async () => {
    const processed = await runOcrOnAllPages();
    if (processed > 0) {
      window.alert(`OCR completed for all ${processed} pages.`);
    }
  }, [runOcrOnAllPages]);

  // ---------- SEARCH (enhanced with OCR) ----------
  const handleSearch = useCallback(async () => {
    const term = searchTerm.trim();
    if (!term || !pdfProxyRef.current) { setSearchResults([]); return; }
    setIsSearching(true);
    const lower = term.toLowerCase();
    const results = [];
    const totalPages = pdfProxyRef.current.numPages || numPages;
    if (!totalPages) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    for (let i = 1; i <= totalPages; i++) {
      let text = '';
      
      // Try to get text from PDF text layer first
      try {
        // Load PDF using pdfjs directly
        const loadingTask = pdfjs.getDocument(demoPdf);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text = content.items.map(x => x.str).join(' ');
      } catch (error) {
        // If PDF text extraction fails, try OCR result
        if (ocrResults[i]) {
          text = ocrResults[i].text;
        }
      }

      // If no text from PDF layer and we have OCR result, use OCR
      if (!text && ocrResults[i]) {
        text = ocrResults[i].text;
      }

      // If still no text and we need to search, trigger OCR for this page
      if (!text) {
        // Optionally trigger OCR automatically, but for now just skip
        continue;
      }

      const ltext = text.toLowerCase();
      if (ltext.includes(lower)) {
        const pos = ltext.indexOf(lower);
        results.push({ 
          id: `${i}-${pos}`, 
          pageNumber: i, 
          snippet: text.substring(Math.max(pos - 40, 0), pos + term.length + 40),
          source: ocrResults[i] ? 'OCR' : 'PDF'
        });
      }
    }
    
    setSearchResults(results);
    setIsSearching(false);
  }, [searchTerm, ocrResults, numPages]);

  const annotationDescriptions = useMemo(() => ({
    highlight: 'Highlight',
    underline: 'Underline',
    strike: 'Strike-through',
    freehand: 'Freehand drawing',
    comment: 'Sticky note',
  }), []);

  // ---------- WORKSPACE: drag from clipping panel TO workspace ----------
  // Drag start on clipping card
  const handleClippingDragStart = useCallback((e, clipId) => {
    // set html5 drag data and fallback ref id
    e.dataTransfer?.setData?.('text/plain', clipId);
    draggingWorkspaceItemId.current = null;
  }, []);

  // Allow drops on workspace container
  const workspaceRef = useRef(null);
  useEffect(() => {
    const root = workspaceRef.current;
    if (!root) return;
    const handleDragOver = (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
    };
    const handleDrop = (ev) => {
      ev.preventDefault();
      const clipId = ev.dataTransfer.getData('text/plain') || ev.dataTransfer?.getData?.('text/clipping') || null;
      const clip = clippings.find(c => c.id === clipId);
      if (!clip) return;
      const rect = root.getBoundingClientRect();
      if (!rect) return;
      // position relative to workspace canvas
      const x = clamp((ev.clientX - rect.left) / rect.width, 0.02, 0.98);
      const y = clamp((ev.clientY - rect.top) / rect.height, 0.02, 0.98);
      const newItem = { id: `ws-${Date.now()}-${Math.floor(Math.random()*10000)}`, clippingId: clipId, x, y, createdAt: new Date().toISOString() };
      setWorkspaceItems(prev => [newItem, ...prev]);
      const firstSegmentPage = clip.segments?.[0]?.sourcePage;
      const targetPage = getPrimaryPageFromSource(firstSegmentPage || clip.sourcePage || primaryPage);
      setPrimaryPage(targetPage);
    };
    root.addEventListener('dragover', handleDragOver);
    root.addEventListener('drop', handleDrop);
    return () => {
      root.removeEventListener('dragover', handleDragOver);
      root.removeEventListener('drop', handleDrop);
    };
}, [clippings, primaryPage]);

  // remove workspace items whose clips no longer exist
  useEffect(() => {
    setWorkspaceItems(prev => prev.filter(item => clippings.some(c => c.id === item.clippingId)));
  }, [clippings]);

  // ---------- WORKSPACE: dragging items to reposition ----------
  const startMoveWorkspaceItem = useCallback((ev, item) => {
    ev.preventDefault();
    ev.stopPropagation();
    // pointer capture approach
    draggingWorkspaceItemId.current = item.id;
    const workspaceCanvas = workspaceRef.current;
    if (!workspaceCanvas) return;
    const rect = workspaceCanvas.getBoundingClientRect();
    if (!rect) return;
    const p = { x: (ev.clientX - rect.left) / rect.width, y: (ev.clientY - rect.top) / rect.height };
    draggingWorkspaceMetaRef.current = { offsetX: p.x - item.x, offsetY: p.y - item.y };
    // capture pointer for smooth dragging (works for touch as well)
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  }, []);

  const handleWorkspacePointerMove = useCallback((ev) => {
    if (!draggingWorkspaceItemId.current) return;
    ev.preventDefault();
    const workspaceCanvas = workspaceRef.current;
    if (!workspaceCanvas) return;
    const rect = workspaceCanvas.getBoundingClientRect();
    if (!rect) return;
    const p = { x: (ev.clientX - rect.left) / rect.width, y: (ev.clientY - rect.top) / rect.height };
    const { offsetX, offsetY } = draggingWorkspaceMetaRef.current;
    const newX = clamp(p.x - offsetX, 0.02, 0.98);
    const newY = clamp(p.y - offsetY, 0.02, 0.98);
    setWorkspaceItems(prev => prev.map(it => it.id === draggingWorkspaceItemId.current ? { ...it, x: newX, y: newY } : it));
  }, []);

  const endMoveWorkspaceItem = useCallback(() => {
    draggingWorkspaceItemId.current = null;
    if (workspaceRef.current) {
      workspaceRef.current.style.cursor = 'default';
    }
  }, []);

  // ---------- CONNECTORS: compute lines from clipping.sourceRect center to workspace item ----------
  const computeConnectorPoints = useCallback((clip, item) => {
    const viewerDeck = viewerDeckRef.current;
    const viewerRect = viewerCanvasRef.current?.getBoundingClientRect();
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    if (!viewerDeck || !viewerRect || !workspaceRect) return [];

    const deckRect = viewerDeck.getBoundingClientRect();
    const to = {
      x: workspaceRect.left + item.x * workspaceRect.width - deckRect.left,
      y: workspaceRect.top + item.y * workspaceRect.height - deckRect.top,
    };

    const buildConnector = (sourceRect) => {
      if (!sourceRect) return null;
      let sx = sourceRect.x + (sourceRect.width || 0) / 2;
      let sy = sourceRect.y + (sourceRect.height || 0) / 2;
      return {
        from: {
          x: viewerRect.left + sx * viewerRect.width - deckRect.left,
          y: viewerRect.top + sy * viewerRect.height - deckRect.top,
        },
        to,
      };
    };

    if (clip?.segments?.length) {
      return clip.segments
        .filter(seg => getPrimaryPageFromSource(seg.sourcePage) === primaryPage)
        .map(seg => buildConnector(seg.sourceRect))
        .filter(Boolean);
    }

    if (getPrimaryPageFromSource(clip?.sourcePage) !== primaryPage) return [];
    const single = buildConnector(clip.sourceRect);
    return single ? [single] : [];
  }, [primaryPage]);

  // when clicking workspace item: jump to source page and pulse highlight
  const handleWorkspaceItemClick = useCallback((item) => {
    const clip = clippings.find(c => c.id === item.clippingId);
    if (!clip) return;
    const targetSegment = clip.segments?.find(seg => getPrimaryPageFromSource(seg.sourcePage) === primaryPage) || clip.segments?.[0];
    const targetPage = targetSegment ? getPrimaryPageFromSource(targetSegment.sourcePage) : clip.sourcePage;
    if (targetPage) setPrimaryPage(targetPage);
    const highlightRect = targetSegment?.sourceRect || clip.sourceRect;
    if (highlightRect && targetPage) {
      const tmp = {
        id: createAnnotationId(),
        type: 'highlight',
        subtype: 'area',
        pageNumber: targetPage,
        color: '#ffe58a',
        position: { ...highlightRect },
        createdAt: new Date().toISOString(),
      };
      setAnnotations(prev => [tmp, ...prev]);
      setTimeout(() => setAnnotations(prev => prev.filter(a => a.id !== tmp.id)), 1000);
    }
  }, [clippings, primaryPage]);

  // ---------- ZOOM & PAN ----------

  // apply transform to viewerCanvasRef
  useEffect(() => {
    const el = viewerCanvasRef.current;
    if (!el) return;
    el.style.transform = `scale(${primaryScale})`;
  }, [primaryScale]);

  // wheel zoom (Ctrl + wheel for fine zoom, otherwise wheel with meta? we'll allow plain wheel + ctrl to zoom)
  useEffect(() => {
    const wrapper = viewerZoomWrapperRef.current;
    if (!wrapper) return;

    let isPointerDownPan = false;
    let panStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

    const onWheel = (ev) => {
      // zoom when ctrlKey (mac: metaKey also can be used but avoid overriding browser zoom)
      if (ev.ctrlKey) {
        ev.preventDefault();
        const delta = -ev.deltaY;
        const step = delta > 0 ? 0.05 : -0.05;
        setPrimaryScale(prev => clamp(+(prev + step).toFixed(2), 0.5, 3));
      }
    };

    const onPointerDown = (ev) => {
      // pan with middle button or while holding Spacebar (common in LT)
      if (ev.button === 1 || ev.shiftKey || ev.code === 'Space') { // shift/space detection for pointerDown is heuristic
        isPointerDownPan = true;
        panStart = { x: ev.clientX, y: ev.clientY, scrollLeft: wrapper.scrollLeft, scrollTop: wrapper.scrollTop };
        wrapper.setPointerCapture?.(ev.pointerId);
      }
    };
    const onPointerMove = (ev) => {
      if (!isPointerDownPan) return;
      ev.preventDefault();
      const dx = ev.clientX - panStart.x;
      const dy = ev.clientY - panStart.y;
      wrapper.scrollLeft = panStart.scrollLeft - dx;
      wrapper.scrollTop = panStart.scrollTop - dy;
    };
    const onPointerUp = (ev) => {
      if (isPointerDownPan) {
        isPointerDownPan = false;
        try { wrapper.releasePointerCapture?.(ev.pointerId); } catch {}
      }
    };

    wrapper.addEventListener('wheel', onWheel, { passive: false });
    wrapper.addEventListener('pointerdown', onPointerDown);
    wrapper.addEventListener('pointermove', onPointerMove);
    wrapper.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);

    return () => {
      wrapper.removeEventListener('wheel', onWheel);
      wrapper.removeEventListener('pointerdown', onPointerDown);
      wrapper.removeEventListener('pointermove', onPointerMove);
      wrapper.removeEventListener('pointerup', onPointerUp);
      wrapper.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  // ---------- small helpers ----------
  const handleDeleteAnnotation = useCallback((id) => {
    updateAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, [updateAnnotations]);

  const handleToggleRightPanel = useCallback(() => {
    setIsRightPanelCollapsed(prev => !prev);
  }, []);

  const handleManualZoom = useCallback((direction) => {
    setPrimaryScale(prev => {
      const delta = direction === 'in' ? 0.05 : -0.05;
      return clamp(+(prev + delta).toFixed(2), 0.5, 3);
    });
  }, []);

  const handleRemoveClipping = useCallback((clippingId) => {
    setClippings(prev => prev.filter(c => c.id !== clippingId));
    setWorkspaceItems(prev => prev.filter(it => it.clippingId !== clippingId));
    setSelectedClippings(prev => prev.filter(id => id !== clippingId));
  }, []);

  const handleToolSelect = useCallback((toolId) => {
    if (toolId === 'underline') {
      applyLineAnnotation('underline');
      return;
    }
    if (toolId === 'strike') {
      applyLineAnnotation('strike');
      return;
    }
    if (toolId === 'textHighlight') {
      applyLineAnnotation('textHighlight');
      return;
    }
    if (toolId === 'comment') {
      applyLineAnnotation('comment');
      return;
    }
    setActiveTool(toolId);
  }, [applyLineAnnotation]);

  // ---------- rendering ----------
  return (
    <div className={styles.workspace}>
      <ClippingsPanel
        clippings={clippings}
        selectedClippings={selectedClippings}
        onCreateClipping={handleClipSelection}
        onCombineClippings={handleCombineClippings}
        onToggleClippingSelection={toggleClippingSelection}
        onClippingDragStart={handleClippingDragStart}
        onReorderClipping={handleReorderClipping}
        onRemoveClipping={handleRemoveClipping}
        onJumpToPage={setPrimaryPage}
        getPrimaryPageFromSource={getPrimaryPageFromSource}
      />

      {/* MAIN VIEWER AREA - Document on left, Workspace on right */}
      <main className={styles.viewerArea}>
        <FloatingToolbar
          toolTypes={TOOL_TYPES}
          activeTool={activeTool}
          onToolClick={handleToolSelect}
          onManualZoom={handleManualZoom}
          primaryScale={primaryScale}
          colorOptions={COLOR_OPTIONS}
          activeColor={activeColor}
          onColorSelect={setActiveColor}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          handleOcrCurrentPage={handleOcrCurrentPage}
          handleOcrAllPages={handleOcrAllPages}
          isOcrRunning={isOcrRunning}
          ocrProgress={ocrProgress}
          ocrResults={ocrResults}
          primaryPage={primaryPage}
          numPages={numPages || 0}
        />

        <div className={styles.viewerDeck} ref={viewerDeckRef}>
          {/* Connector SVG - positioned absolutely to span both panes */}
          <svg className={styles.connectorSvg}>
            {workspaceItems.map(item => {
              const clip = clippings.find(c => c.id === item.clippingId);
              if (!clip) return null;
              const connectors = computeConnectorPoints(clip, item);
              if (!connectors || connectors.length === 0) return null;
              return connectors.map((pts, idx) => {
                const { from, to } = pts;
                const midX = (from.x + to.x) / 2;
                const path = `M ${from.x} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`;
                return <path key={`conn-${item.id}-${idx}`} d={path} stroke="rgba(99, 102, 241, 0.35)" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              });
            })}
          </svg>

          {/* DOCUMENT PANE - Left side */}
          <div className={styles.documentPane}>
            <div ref={viewerZoomWrapperRef} className={styles.viewerZoomWrapper}>
              <Document file={demoPdf} onLoadSuccess={onDocumentLoadSuccess}>
                <section className={styles.singlePane}>
                  <div
                    ref={viewerCanvasRef}
                    className={styles.viewerCanvas}
                    // viewerCanvas is scaled by primaryScale via inline style in effect
                  >
                    <Page pageNumber={primaryPage} scale={primaryScale} renderTextLayer renderAnnotationLayer />

                    {/* Annotation overlay inside the transformed canvas */}
                    <div
                      ref={(n) => { overlayRefs.current.primary = n; }}
                      className={styles.annotationOverlay}
                      data-overlay
                      data-drawing-tool={['highlight', 'freehand', 'bookmark', 'clip'].includes(activeTool) ? 'true' : undefined}
                      onPointerDown={(e) => handlePointerDown(e, primaryPage, 'primary')}
                      onPointerMove={(e) => handlePointerMove(e, 'primary')}
                      onPointerUp={(e) => handlePointerUp(e, 'primary')}
                    >
                    {/* SVG for page annotations */}
                    <svg className={styles.annotationSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                      {filteredAnnotations
                        .filter((a) => a.pageNumber === primaryPage && a.type !== 'comment')
                        .map((a) => {
                          if (a.type === 'highlight' && a.rects) {
                            return a.rects.map((r, i) => (
                              <rect key={`${a.id}-rect-${i}`} className={styles.highlightRect} x={`${r.x * 100}%`} y={`${r.y * 100}%`} width={`${r.width * 100}%`} height={`${r.height * 100}%`} fill={a.color} opacity="0.3" />
                            ));
                          }
                          if (a.type === 'highlight' && a.position) {
                            const { x, y, width, height } = a.position;
                            return <rect key={a.id} className={styles.highlightRect} x={`${x * 100}%`} y={`${y * 100}%`} width={`${width * 100}%`} height={`${height * 100}%`} fill={a.color} />;
                          }
                          if ((a.type === 'underline' || a.type === 'strike') && a.lines) {
                            return a.lines.map((line, i) => (
                              <line key={`${a.id}-line-${i}`} className={a.type === 'underline' ? styles.underlineLine : styles.strikeLine} x1={`${line.x1 * 100}%`} y1={`${line.y1 * 100}%`} x2={`${line.x2 * 100}%`} y2={`${line.y2 * 100}%`} stroke={a.color} vectorEffect="non-scaling-stroke" />
                            ));
                          }
                          if (a.type === 'freehand') {
                            const pts = a.points.map(p => `${p.x * 100},${p.y * 100}`).join(' ');
                            return <polyline key={a.id} className={styles.freehandPath} points={pts} stroke={a.color} vectorEffect="non-scaling-stroke" />;
                          }
                          return null;
                        })}

                      {/* live drawing */}
                      {drawingState?.type === 'freehand' && drawingState.points?.length > 1 && (
                        <polyline className={styles.freehandPath} points={drawingState.points.map(p => `${p.x * 100},${p.y * 100}`).join(' ')} stroke={activeColor} vectorEffect="non-scaling-stroke" />
                      )}
                      {drawingState?.type === 'highlight' && drawingState.start && (
                        <rect className={styles.highlightRect}
                          x={`${Math.min(drawingState.lastPoint?.x || drawingState.start.x, drawingState.start.x) * 100}%`}
                          y={`${Math.min(drawingState.lastPoint?.y || drawingState.start.y, drawingState.start.y) * 100}%`}
                          width={`${Math.abs((drawingState.lastPoint?.x || drawingState.start.x) - drawingState.start.x) * 100}%`}
                          height={`${Math.abs((drawingState.lastPoint?.y || drawingState.start.y) - drawingState.start.y) * 100}%`}
                          fill={activeColor}
                        />
                      )}
                      {drawingState?.type === 'clip' && drawingState.start && (
                        <rect className={styles.highlightRect}
                          x={`${Math.min(drawingState.lastPoint?.x || drawingState.start.x, drawingState.start.x) * 100}%`}
                          y={`${Math.min(drawingState.lastPoint?.y || drawingState.start.y, drawingState.start.y) * 100}%`}
                          width={`${Math.abs((drawingState.lastPoint?.x || drawingState.start.x) - drawingState.start.x) * 100}%`}
                          height={`${Math.abs((drawingState.lastPoint?.y || drawingState.start.y) - drawingState.start.y) * 100}%`}
                          fill="rgba(59, 130, 246, 0.2)"
                          stroke="rgba(59, 130, 246, 0.8)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      )}
                    </svg>

                    {/* comment badges */}
                    {filteredAnnotations
                      .filter((a) => a.pageNumber === primaryPage && a.type === 'comment')
                      .map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className={styles.noteBadge}
                          style={{ left: `${a.position.x * 100}%`, top: `${a.position.y * 100}%`, backgroundColor: a.color }}
                          onPointerDown={(e) => handleStartDraggingNote(e, a)}
                          title={a.linkedText ? `Linked: ${a.linkedText}` : 'Note'}
                        >
                          <strong>Note</strong> {a.content}
                        </button>
                      ))}

                    {/* bookmarks */}
                    {bookmarks
                      .filter(bm => bm.pageNumber === primaryPage)
                      .map(bm => (
                        <div
                          key={bm.id}
                          className={styles.bookmarkFlag}
                          style={{
                            left: `${bm.position.x * 100}%`,
                            top: `${bm.position.y * 100}%`,
                            backgroundColor: bm.color,
                            cursor: activeTool === 'select' ? 'grab' : 'default',
                          }}
                          onPointerDown={(e) => handleStartDraggingBookmark(e, bm)}
                          title={bm.note || 'Bookmark'}
                        >
                          <MdBookmark size={18} color="white" />
                          {bm.note && <span className={styles.bookmarkNote}>{bm.note}</span>}
                        </div>
                      ))}
                  </div>

                </div>

                {/* paging controls */}
                <div className={styles.pagingControls}>
                  <button type="button" className={styles.toggleButton} onClick={() => setPrimaryPage(p => clamp(p - 1, 1, numPages || 1))}>Prev</button>
                  <span>Page <input className={styles.inputSmall} type="number" value={primaryPage} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) setPrimaryPage(clamp(v, 1, numPages || 1)); }} /> of {numPages || '–'}</span>
                  <button type="button" className={styles.toggleButton} onClick={() => setPrimaryPage(p => clamp(p + 1, 1, numPages || 1))}>Next</button>
                </div>
              </section>
            </Document>
          </div>
          </div>

          {/* WORKSPACE PANE - Right side (separate from document) */}
          <div className={`${styles.workspacePane} ${isRightPanelCollapsed ? styles.workspacePaneExpanded : ''}`}>
            <div className={styles.workspaceHeader}>
              <h3 className={styles.workspaceTitle}>Workspace</h3>
              <p className={styles.workspaceSubtitle}>Drop clippings here. Drag to rearrange. Click to jump to source.</p>
            </div>
            <div
              ref={workspaceRef}
              className={styles.workspaceCanvas}
              onPointerMove={handleWorkspacePointerMove}
              onPointerUp={endMoveWorkspaceItem}
            >
              {workspaceItems.length === 0 ? (
                <div className={styles.workspaceEmptyState}>
                  <p>Drag clippings from the left panel to this workspace</p>
                </div>
              ) : (
                workspaceItems.map(item => {
                  const clip = clippings.find(c => c.id === item.clippingId);
                  return (
                    <div
                      key={item.id}
                      className={`${styles.workspaceItem} ${
                        draggingWorkspaceItemId.current === item.id ? styles.dragging : ''
                      }`}
                      style={{
                        left: `${item.x * 100}%`,
                        top: `${item.y * 100}%`,
                      transform: draggingWorkspaceItemId.current === item.id ? 'translateZ(10px) scale(1.02)' : 'none',
    zIndex: draggingWorkspaceItemId.current === item.id ? 1000 : 1,
    boxShadow: draggingWorkspaceItemId.current === item.id 
      ? '0 20px 40px rgba(0,0,0,0.2)' 
      : '0 4px 12px rgba(0,0,0,0.1)',
  }}
                      onPointerDown={(ev) => startMoveWorkspaceItem(ev, item)}
                      onClick={() => handleWorkspaceItemClick(item)}
                    >
                      <div className={styles.workspaceItemHeader}>{clip?.segments ? 'Combined Clip' : 'Clip'}</div>
                      <div className={styles.workspaceItemContent}>
                        {clip?.segments
                          ? clip.segments.map(seg => (
                              <div key={seg.id} className={styles.workspaceSegment}>
                                <span className={styles.workspaceSegmentLabel}>{seg.label}</span>
                                <p>{seg.content}</p>
                              </div>
                            ))
                          : clip?.content}
                      </div>
                      <div className={styles.workspaceItemActions}>
                        <button className={styles.linkButton} onClick={(e) => {
                          e.stopPropagation();
                          const jumpTarget = clip?.segments?.[0]?.sourcePage || clip?.sourcePage;
                          if (jumpTarget) setPrimaryPage(getPrimaryPageFromSource(jumpTarget));
                        }}>Jump</button>
                        {/* <button className={styles.linkButton} onClick={(e) => { e.stopPropagation(); setWorkspaceItems(prev => prev.filter(it => it.id !== item.id)); }}>Remove</button> */}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <SearchPanel
          isSearching={isSearching}
          results={searchResults}
          onSelectResult={setPrimaryPage}
        />
      </main>

      {/* RIGHT PANEL - Annotations + Bookmarks */}
      <aside className={`${styles.rightPanel} ${isRightPanelCollapsed ? styles.rightPanelCollapsed : ''}`}>
        <button type="button" className={styles.panelToggle} onClick={handleToggleRightPanel}>
          {isRightPanelCollapsed ? <MdChevronLeft size={18} /> : <MdChevronRight size={18} />}
          <span>{isRightPanelCollapsed ? 'Open notes' : 'Collapse notes'}</span>
        </button>

        {!isRightPanelCollapsed && (
          <>
            <div className={styles.panelHeader}>Annotations</div>
            <div className={styles.panelContent}>
              <div className={styles.annotationFilters}>
                {ANNOTATION_TYPES.map(t => (
                  <button key={t} type="button" className={`${styles.filterChip} ${annotationFilters[t] ? styles.filterChipActive : ''}`} onClick={() => toggleAnnotationFilter(t)}>
                    <input type="checkbox" readOnly checked={annotationFilters[t]} /> {annotationDescriptions[t]}
                  </button>
                ))}
              </div>

              {filteredAnnotations.length === 0 ? (
                <div className={styles.emptyState}>Use tools to annotate.</div>
              ) : (
                <div className={styles.annotationList}>
                  {filteredAnnotations.map(a => (
                    <div key={a.id} className={styles.annotationCard}>
                      <div className={styles.annotationTitle}>
                        <span>{annotationDescriptions[a.type]}{a.lines && ` (${a.lines.length} line${a.lines.length > 1 ? 's' : ''})`}</span>
                        <span>Page {a.pageNumber}</span>
                      </div>
                      {a.type === 'comment' && <p><strong>Note:</strong> {a.content}</p>}
                      {a.subtype === 'text' && a.text && <p><strong>Text:</strong> {a.text.substring(0, 80)}{a.text.length > 80 ? '...' : ''}</p>}
                      {a.linkedText && <p><strong>Linked:</strong> {a.linkedText}</p>}
                      <small>{new Date(a.createdAt).toLocaleString()}</small>
                      <div className={styles.clippingActions}>
                        <button type="button" className={styles.linkButton} onClick={() => setPrimaryPage(a.pageNumber)}>Jump</button>
                        <button type="button" className={styles.linkButton} onClick={() => handleDeleteAnnotation(a.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.panelHeader}>Bookmarks ({bookmarks.length})</div>
            <div className={styles.panelContent}>
              <div className={styles.toolbarGroup} style={{ marginBottom: 12, fontSize: 12 }}>
                <span>Color:</span>
                <div className={styles.colorSwatches}>
                  {BOOKMARK_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorDot} ${activeBookmarkColor === c ? styles.colorDotActive : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setActiveBookmarkColor(c)}
                    />
                  ))}
                </div>
              </div>

              {bookmarks.length === 0 ? (
                <div className={styles.emptyState}>
                  Click the <MdBookmarkAdd size={14} /> Bookmark tool and tap anywhere on the page
                </div>
              ) : (
                <div className={styles.annotationList}>
                  {bookmarks
                    .sort((a, b) => a.pageNumber - b.pageNumber || a.createdAt.localeCompare(b.createdAt))
                    .map(bm => (
                      <div key={bm.id} className={styles.annotationCard}>
                        <div className={styles.annotationTitle}>
                          <span style={{ color: bm.color }}>Bookmark</span>
                          <span>Page {bm.pageNumber}</span>
                        </div>
                        {bm.note && <p><strong>Note:</strong> {bm.note}</p>}
                        <small>{new Date(bm.createdAt).toLocaleDateString()} {new Date(bm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        <div className={styles.clippingActions}>
                          <button type="button" className={styles.linkButton} onClick={() => setPrimaryPage(bm.pageNumber)}>Jump</button>
                          <button type="button" className={styles.linkButton} style={{ color: '#ef4444' }} onClick={() => setBookmarks(prev => prev.filter(b => b.id !== bm.id))}>Remove</button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default DocumentWorkspacePage;
