
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, Image as ImageIcon, Minus, Plus, Maximize, 
  Eraser, PaintBucket, Sparkles, PlusCircle, Bold, Italic, Underline,
  Type as TypeIcon, Trash2, RotateCw, AlignLeft, AlignCenter, AlignRight,
  ArrowRight, Scissors, Frame, Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { EditorState, TextLayer, HistoryItem, ToastType } from '../../types';
import { FONTS } from '../../constants';
import Header from '../Header';

interface EditorTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onToast: (message: string, type: ToastType) => void;
  initialImage?: string | null;
  onClearSharedImage?: () => void;
}

const getInitialState = (): EditorState => ({
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  rotation: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  texts: [],
  maskDataUrl: null,
  filter: 'none'
});

const EditorTab: React.FC<EditorTabProps> = ({ onLoading, onToast, initialImage, onClearSharedImage }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(getInitialState());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);
  
  // Typography State
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(40);
  const [textRotation, setTextRotation] = useState(0);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [hasShadow, setHasShadow] = useState(true);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [cropHandle, setCropHandle] = useState<string | null>(null);

  // AI & Effects State
  const [activeAiTool, setActiveAiTool] = useState<string | null>(null);
  const [bgPrompt, setBgPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [outpaintingZoom, setOutpaintingZoom] = useState(100);
  const [isOutpaintingActive, setIsOutpaintingActive] = useState(false);
  const [isMaskingActive, setIsMaskingActive] = useState(false);
  const [brushSize, setBrushSize] = useState(40);

  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const pinchDistanceRef = useRef<number | null>(null);

  const [isDrawingMask, setIsDrawingMask] = useState(false);

  useEffect(() => {
    if (initialImage) {
      onLoading(true, "Loading image from AI Imaging...");
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setEditorState(getInitialState());
        setHistory([]);
        setRedoStack([]);
        onLoading(false);
        if (onClearSharedImage) onClearSharedImage();
      };
      img.src = initialImage;
    }
  }, [initialImage, onLoading, onClearSharedImage]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Account for CSS scaling (zoom)
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getMousePos(e);

    if (isMaskingActive) {
      setIsDrawingMask(true);
      const ctx = maskCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ff00ff'; // Visible magenta for user
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
      return;
    }

    if (isOutpaintingActive && image) {
      const canvas = canvasRef.current;
      if (canvas) {
        const handleSize = 20;
        const scale = 100 / outpaintingZoom;
        const iw = image.width * scale;
        const ih = image.height * scale;
        const ix = (canvas.width - iw) / 2;
        const iy = (canvas.height - ih) / 2;

        if (Math.abs(x - ix) < handleSize && Math.abs(y - iy) < handleSize) return setCropHandle('op-tl');
        if (Math.abs(x - (ix + iw)) < handleSize && Math.abs(y - iy) < handleSize) return setCropHandle('op-tr');
        if (Math.abs(x - ix) < handleSize && Math.abs(y - (iy + ih)) < handleSize) return setCropHandle('op-bl');
        if (Math.abs(x - (ix + iw)) < handleSize && Math.abs(y - (iy + ih)) < handleSize) return setCropHandle('op-br');
      }
    }

    if (isCropping && cropRect) {
      const handleSize = 20;
      const { x: cx, y: cy, w: cw, h: ch } = cropRect;
      
      // Check handles
      if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) return setCropHandle('tl');
      if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) return setCropHandle('tr');
      if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return setCropHandle('bl');
      if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return setCropHandle('br');
      
      // Check edges
      if (Math.abs(y - cy) < handleSize && x > cx && x < cx + cw) return setCropHandle('t');
      if (Math.abs(y - (cy + ch)) < handleSize && x > cx && x < cx + cw) return setCropHandle('b');
      if (Math.abs(x - cx) < handleSize && y > cy && y < cy + ch) return setCropHandle('l');
      if (Math.abs(x - (cx + cw)) < handleSize && y > cy && y < cy + ch) return setCropHandle('r');

      // Check inside
      if (x > cx && x < cx + cw && y > cy && y < cy + ch) {
        setCropHandle('move');
        setDragStart({ x: x - cx, y: y - cy });
        return;
      }
      
      // If click outside, start new rect
      setCropRect({ x, y, w: 0, h: 0 });
      setCropHandle('br');
      return;
    }

    if (isCropping) {
      setCropRect({ x, y, w: 0, h: 0 });
      setCropHandle('br');
      return;
    }

    // Find text layer under mouse (reverse order to get top-most)
    const clickedText = [...editorState.texts].reverse().find(text => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      ctx.font = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic ' : ''}${text.size}px ${text.font}`;
      const metrics = ctx.measureText(text.text);
      const height = text.size * 1.5; // Even larger hit area
      const width = metrics.width + 40;
      
      let startX = text.x;
      if (text.align === 'center') startX -= width / 2;
      if (text.align === 'right') startX -= width;
      
      const startY = text.y - height / 2;
      
      return x >= startX && x <= startX + width && y >= startY && y <= startY + height;
    });

    if (clickedText) {
      setDraggingTextId(clickedText.id);
      setSelectedTextId(clickedText.id);
      setDragStart({ x: x - clickedText.x, y: y - clickedText.y });
      
      // Sync UI with selected text
      setTextInput(clickedText.text);
      setTextFont(clickedText.font);
      setTextColor(clickedText.color);
      setTextSize(clickedText.size);
      setTextRotation(clickedText.rotation);
      setTextAlign(clickedText.align);
      setIsBold(clickedText.bold);
      setIsItalic(clickedText.italic);
      setIsUnderline(clickedText.underline);
      setHasShadow(clickedText.shadow);
      
      saveToHistory();
    } else {
      setSelectedTextId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      if (pinchDistanceRef.current) {
        const delta = distance - pinchDistanceRef.current;
        const zoomChange = delta * 0.005;
        updateState('zoom', Math.max(0.1, Math.min(5, editorState.zoom + zoomChange)));
      }
      pinchDistanceRef.current = distance;
      return;
    }
    pinchDistanceRef.current = null;

    const { x, y } = getMousePos(e);

    if (isOutpaintingActive && cropHandle?.startsWith('op-')) {
      if (e.cancelable) e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      
      // Calculate new zoom based on distance from center
      const dx = Math.abs(x - canvas.width / 2);
      const dy = Math.abs(y - canvas.height / 2);
      const targetW = dx * 2;
      const targetH = dy * 2;
      
      const zoomW = (image.width / targetW) * 100;
      const zoomH = (image.height / targetH) * 100;
      const newZoom = Math.max(50, Math.min(200, Math.round(Math.max(zoomW, zoomH))));
      setOutpaintingZoom(newZoom);
      return;
    }

    if (isMaskingActive && isDrawingMask) {
      const ctx = maskCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineWidth = brushSize;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      return;
    }

    if (isCropping && cropHandle && cropRect) {
      if (e.cancelable) e.preventDefault();
      const { x: cx, y: cy, w: cw, h: ch } = cropRect;
      
      switch (cropHandle) {
        case 'tl': setCropRect({ x, y, w: cw + (cx - x), h: ch + (cy - y) }); break;
        case 'tr': setCropRect({ ...cropRect, y, w: x - cx, h: ch + (cy - y) }); break;
        case 'bl': setCropRect({ ...cropRect, x, w: cw + (cx - x), h: y - cy }); break;
        case 'br': setCropRect({ ...cropRect, w: x - cx, h: y - cy }); break;
        case 't': setCropRect({ ...cropRect, y, h: ch + (cy - y) }); break;
        case 'b': setCropRect({ ...cropRect, h: y - cy }); break;
        case 'l': setCropRect({ ...cropRect, x, w: cw + (cx - x) }); break;
        case 'r': setCropRect({ ...cropRect, w: x - cx }); break;
        case 'move': setCropRect({ ...cropRect, x: x - dragStart.x, y: y - dragStart.y }); break;
      }
      return;
    }

    if (isCropping && !cropHandle) {
      // Update cursor for handles
      const canvasWrapper = canvasRef.current?.parentElement;
      if (canvasWrapper && cropRect) {
        const handleSize = 20;
        const { x: cx, y: cy, w: cw, h: ch } = cropRect;
        let cursor = 'crosshair';
        
        if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) cursor = 'nw-resize';
        else if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) cursor = 'ne-resize';
        else if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) cursor = 'sw-resize';
        else if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) cursor = 'se-resize';
        else if (Math.abs(y - cy) < handleSize && x > cx && x < cx + cw) cursor = 'n-resize';
        else if (Math.abs(y - (cy + ch)) < handleSize && x > cx && x < cx + cw) cursor = 's-resize';
        else if (Math.abs(x - cx) < handleSize && y > cy && y < cy + ch) cursor = 'w-resize';
        else if (Math.abs(x - (cx + cw)) < handleSize && y > cy && y < cy + ch) cursor = 'e-resize';
        else if (x > cx && x < cx + cw && y > cy && y < cy + ch) cursor = 'move';
        
        canvasWrapper.style.cursor = cursor;
      }
      return;
    }

    if (draggingTextId) {
      if (e.cancelable) e.preventDefault();
      setEditorState(prev => ({
        ...prev,
        texts: prev.texts.map(t => t.id === draggingTextId ? { ...t, x: x - dragStart.x, y: y - dragStart.y } : t)
      }));
      return;
    }

    // Cursor feedback
    const isOverText = editorState.texts.some(text => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.font = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic ' : ''}${text.size}px ${text.font}`;
      const metrics = ctx.measureText(text.text);
      const width = metrics.width;
      const height = text.size;
      let startX = text.x;
      if (text.align === 'center') startX -= width / 2;
      if (text.align === 'right') startX -= width;
      const startY = text.y - height / 2;
      return x >= startX && x <= startX + width && y >= startY && y <= startY + height;
    });

    const canvasWrapper = canvasRef.current?.parentElement;
    if (canvasWrapper) {
      if (isCropping) {
        canvasWrapper.style.cursor = 'crosshair';
      } else {
        canvasWrapper.style.cursor = isOverText ? 'move' : 'default';
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingTextId(null);
    setCropHandle(null);
    setIsDrawingMask(false);
    pinchDistanceRef.current = null;
  };

  const saveToHistory = useCallback(() => {
    if (!image) return;
    const item: HistoryItem = {
      imageSrc: image.src,
      editorState: JSON.parse(JSON.stringify(editorState))
    };
    setHistory(prev => [...prev.slice(-19), item]);
    setRedoStack([]);
  }, [image, editorState]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rads = (editorState.rotation * Math.PI) / 180;
    const w = image.width * Math.abs(Math.cos(rads)) + image.height * Math.abs(Math.sin(rads));
    const h = image.width * Math.abs(Math.sin(rads)) + image.height * Math.abs(Math.cos(rads));
    
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    
    let filterStr = `brightness(${100 + editorState.brightness}%) contrast(${100 + editorState.contrast}%) saturate(${100 + editorState.saturation}%) blur(${editorState.blur}px)`;
    if (editorState.filter && editorState.filter !== 'none') {
      filterStr += ` ${editorState.filter}`;
    }
    ctx.filter = filterStr;
    
    const outpaintScale = isOutpaintingActive ? (100 / outpaintingZoom) : 1;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rads);
    ctx.scale(outpaintScale, outpaintScale);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    // Draw Outpainting Guide
    if (isOutpaintingActive) {
      ctx.save();
      ctx.filter = 'none';
      const scale = 100 / outpaintingZoom;
      const iw = image.width * scale;
      const ih = image.height * scale;
      const ix = (w - iw) / 2;
      const iy = (h - ih) / 2;

      // Dim the area that will be filled
      ctx.fillStyle = 'rgba(20, 184, 166, 0.1)'; // teal-500 with low opacity
      // Top
      ctx.fillRect(0, 0, w, iy);
      // Bottom
      ctx.fillRect(0, iy + ih, w, h - (iy + ih));
      // Left
      ctx.fillRect(0, iy, ix, ih);
      // Right
      ctx.fillRect(ix + iw, iy, w - (ix + iw), ih);

      // Draw dashed border
      ctx.strokeStyle = '#14b8a6'; // teal-500
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, iw, ih);

      // Draw handles
      ctx.fillStyle = '#14b8a6';
      const hs = 10;
      ctx.fillRect(ix - hs/2, iy - hs/2, hs, hs);
      ctx.fillRect(ix + iw - hs/2, iy - hs/2, hs, hs);
      ctx.fillRect(ix - hs/2, iy + ih - hs/2, hs, hs);
      ctx.fillRect(ix + iw - hs/2, iy + ih - hs/2, hs, hs);
      
      ctx.restore();
    }

    // Draw Crop Overlay
    if (isCropping && cropRect) {
      ctx.save();
      const { x: cx, y: cy, w: cw, h: ch } = cropRect;
      
      // Draw dimmed overlay around the selection area
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      // Top
      ctx.fillRect(0, 0, w, cy);
      // Bottom
      ctx.fillRect(0, cy + ch, w, h - (cy + ch));
      // Left
      ctx.fillRect(0, cy, cx, ch);
      // Right
      ctx.fillRect(cx + cw, cy, w - (cx + cw), ch);
      
      // Selection border
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cw, ch);
      
      // Draw handles
      ctx.fillStyle = '#3b82f6';
      const hs = 8;
      // Corners
      ctx.fillRect(cx - hs/2, cy - hs/2, hs, hs); // tl
      ctx.fillRect(cx + cw - hs/2, cy - hs/2, hs, hs); // tr
      ctx.fillRect(cx - hs/2, cy + ch - hs/2, hs, hs); // bl
      ctx.fillRect(cx + cw - hs/2, cy + ch - hs/2, hs, hs); // br
      
      // Edges
      ctx.fillRect(cx + cw/2 - hs/2, cy - hs/2, hs, hs); // t
      ctx.fillRect(cx + cw/2 - hs/2, cy + ch - hs/2, hs, hs); // b
      ctx.fillRect(cx - hs/2, cy + ch/2 - hs/2, hs, hs); // l
      ctx.fillRect(cx + cw - hs/2, cy + ch/2 - hs/2, hs, hs); // r
      
      ctx.restore();
    }

    editorState.texts.forEach(text => {
      ctx.save();
      ctx.translate(text.x, text.y);
      ctx.rotate((text.rotation * Math.PI) / 180);
      let fontStr = '';
      if (text.italic) fontStr += 'italic ';
      if (text.bold) fontStr += 'bold ';
      fontStr += `${text.size}px ${text.font}`;
      ctx.font = fontStr;
      ctx.fillStyle = text.color;
      ctx.textAlign = text.align;
      ctx.textBaseline = 'middle';
      
      if (text.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }

      ctx.fillText(text.text, 0, 0);
      
      if (text.underline) {
        const metrics = ctx.measureText(text.text);
        ctx.beginPath();
        ctx.strokeStyle = text.color;
        ctx.lineWidth = text.size / 15;
        let startX = 0;
        if (text.align === 'center') startX = -metrics.width / 2;
        if (text.align === 'right') startX = -metrics.width;
        ctx.moveTo(startX, text.size / 2);
        ctx.lineTo(startX + metrics.width, text.size / 2);
        ctx.stroke();
      }

      // Selection indicator
      if (text.id === selectedTextId) {
        const metrics = ctx.measureText(text.text);
        const padding = 10;
        ctx.strokeStyle = '#14b8a6'; // teal-500
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        let startX = -padding;
        if (text.align === 'center') startX = -metrics.width / 2 - padding;
        if (text.align === 'right') startX = -metrics.width - padding;
        ctx.strokeRect(startX, -text.size / 2 - padding, metrics.width + padding * 2, text.size + padding * 2);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    });
  }, [image, editorState, selectedTextId, isCropping, cropRect, isOutpaintingActive, outpaintingZoom]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    if (canvasRef.current && maskCanvasRef.current) {
      const canvas = canvasRef.current;
      const mask = maskCanvasRef.current;
      if (mask.width !== canvas.width || mask.height !== canvas.height) {
        mask.width = canvas.width;
        mask.height = canvas.height;
      }
    }
  }, [image, editorState.rotation]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoading(true, "Loading image...");
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => { 
          setImage(img); 
          setEditorState(getInitialState());
          setHistory([]);
          setRedoStack([]);
          
          // Reset mask canvas
          if (maskCanvasRef.current) {
            maskCanvasRef.current.width = img.width;
            maskCanvasRef.current.height = img.height;
            const ctx = maskCanvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, img.width, img.height);
          }
          
          onLoading(false); 
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateState = (key: keyof EditorState, val: any) => {
    setEditorState(prev => ({ ...prev, [key]: val }));
  };

  const handleSliderStart = () => {
    saveToHistory();
  };

  // Header Actions
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClear = () => {
    setImage(null);
    setEditorState(getInitialState());
    setHistory([]);
    setRedoStack([]);
    setSelectedTextId(null);
    setTextInput("");
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setHasShadow(true);
    setTextColor("#ffffff");
    setTextSize(40);
    setTextRotation(0);
    setTextAlign('center');
    setTextFont(FONTS[0].value);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const current: HistoryItem = {
      imageSrc: image!.src,
      editorState: JSON.parse(JSON.stringify(editorState))
    };
    const prev = history[history.length - 1];
    
    setRedoStack(old => [current, ...old]);
    setHistory(old => old.slice(0, -1));
    
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setEditorState(prev.editorState);
    };
    img.src = prev.imageSrc;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const current: HistoryItem = {
      imageSrc: image!.src,
      editorState: JSON.parse(JSON.stringify(editorState))
    };
    const next = redoStack[0];
    
    setHistory(old => [...old, current]);
    setRedoStack(old => old.slice(1));
    
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setEditorState(next.editorState);
    };
    img.src = next.imageSrc;
  };

  const handleResize = (w: number, h: number) => {
    if (!image || !canvasRef.current || w <= 0 || h <= 0) return;
    saveToHistory();
    onLoading(true, "Resizing...");
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvasRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height, 0, 0, w, h);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setEditorState(prev => ({ ...prev, rotation: 0, texts: [] })); // Clear texts as they are baked
        onLoading(false);
      };
      img.src = tempCanvas.toDataURL();
    }
  };

  const handleCrop = () => {
    if (!image || !canvasRef.current) return;
    
    if (!isCropping) {
      setIsCropping(true);
      const canvas = canvasRef.current;
      const padding = 50;
      setCropRect({
        x: padding,
        y: padding,
        w: canvas.width - padding * 2,
        h: canvas.height - padding * 2
      });
      return;
    }

    if (!cropRect || Math.abs(cropRect.w) < 10 || Math.abs(cropRect.h) < 10) {
      setIsCropping(false);
      setCropRect(null);
      return;
    }

    saveToHistory();
    onLoading(true, "Cropping...");
    
    const canvas = canvasRef.current;
    
    // Normalize rect
    const x = cropRect.w > 0 ? cropRect.x : cropRect.x + cropRect.w;
    const y = cropRect.h > 0 ? cropRect.y : cropRect.y + cropRect.h;
    const width = Math.abs(cropRect.w);
    const height = Math.abs(cropRect.h);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setEditorState(prev => ({ ...prev, rotation: 0, texts: [] }));
        setIsCropping(false);
        setCropRect(null);
        onLoading(false);
      };
      img.src = tempCanvas.toDataURL();
    }
  };

  // Reactive updates for selected text
  useEffect(() => {
    if (selectedTextId) {
      setEditorState(prev => ({
        ...prev,
        texts: prev.texts.map(t => t.id === selectedTextId ? {
          ...t,
          text: textInput,
          font: textFont,
          color: textColor,
          size: textSize,
          rotation: textRotation,
          align: textAlign,
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
          shadow: hasShadow
        } : t)
      }));
    }
  }, [textInput, textFont, textColor, textSize, textRotation, textAlign, isBold, isItalic, isUnderline, hasShadow, selectedTextId]);

  const handleAddTextLayer = () => {
    if (!textInput.trim()) return;
    saveToHistory();
    const newText: TextLayer = {
      id: Date.now().toString(),
      text: textInput,
      x: (canvasRef.current?.width || 500) / 2,
      y: (canvasRef.current?.height || 500) / 2,
      size: textSize,
      color: textColor,
      font: textFont,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      shadow: hasShadow,
      align: textAlign,
      rotation: textRotation
    };
    setEditorState(prev => ({
      ...prev,
      texts: [...prev.texts, newText]
    }));
    setTextInput("");
  };

  // AI Functions
  const callGeminiAI = async (prompt: string, mode: 'remove_bg' | 'replace_bg' | 'magic_edit' | 'outpainting') => {
    if (!image || !canvasRef.current) return;
    onLoading(true, `AI sedang memproses ${mode.replace('_', ' ')}...`);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare the main image (the current canvas state)
      const mainImageData = canvasRef.current.toDataURL('image/png').split(',')[1];
      
      let parts: any[] = [
        {
          inlineData: {
            data: mainImageData,
            mimeType: "image/png"
          }
        }
      ];

      // Add mask for magic edit
      if (mode === 'magic_edit' && maskCanvasRef.current) {
        // Create a proper B&W mask for the AI
        const tempMaskCanvas = document.createElement('canvas');
        tempMaskCanvas.width = maskCanvasRef.current.width;
        tempMaskCanvas.height = maskCanvasRef.current.height;
        const tctx = tempMaskCanvas.getContext('2d');
        if (tctx) {
          tctx.fillStyle = 'black';
          tctx.fillRect(0, 0, tempMaskCanvas.width, tempMaskCanvas.height);
          tctx.globalCompositeOperation = 'source-over';
          tctx.drawImage(maskCanvasRef.current, 0, 0);
          // Convert any painted area to white
          tctx.globalCompositeOperation = 'source-in';
          tctx.fillStyle = 'white';
          tctx.fillRect(0, 0, tempMaskCanvas.width, tempMaskCanvas.height);
          
          parts.push({
            inlineData: {
              data: tempMaskCanvas.toDataURL('image/png').split(',')[1],
              mimeType: "image/png"
            }
          });
          
          prompt = `The first image is the original. The second image is a mask where white pixels indicate the area to be modified. Instruction: ${prompt}. Return only the resulting image.`;
        }
      } else if (mode === 'outpainting') {
        prompt = `Outpaint and expand this image to fill the entire frame naturally. Maintain the style and content of the original image. Instruction: ${prompt}. Return only the resulting image.`;
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("Gagal menerima respon dari AI.");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const img = new Image();
          img.onload = () => {
            saveToHistory();
            setImage(img);
            setEditorState(prev => ({ 
              ...prev, 
              texts: [], 
              brightness: 0, 
              contrast: 0, 
              saturation: 0, 
              blur: 0,
              rotation: 0,
              filter: 'none'
            }));
            
            // Clear mask
            if (maskCanvasRef.current) {
              const ctx = maskCanvasRef.current.getContext('2d');
              ctx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            }
            setIsMaskingActive(false);
            setIsOutpaintingActive(false);
            onLoading(false);
          };
          img.src = `data:image/png;base64,${part.inlineData.data}`;
          return;
        }
      }
      throw new Error("AI tidak mengembalikan gambar hasil proses.");
    } catch (error) {
      console.error("AI Error:", error);
      onToast("Kesalahan AI: " + (error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui"), ToastType.ERROR);
      onLoading(false);
    }
  };

  const handleRemoveBackground = () => callGeminiAI("Remove the background and make it transparent.", "remove_bg");
  const handleReplaceBackground = () => callGeminiAI(`Replace the background with: ${bgPrompt || 'a professional studio background'}.`, "replace_bg");
  const handleMagicEdit = () => {
    if (!editPrompt.trim()) {
      onToast("Silakan masukkan instruksi edit terlebih dahulu.", ToastType.WARNING);
      return;
    }
    callGeminiAI(editPrompt, "magic_edit");
  };
  const handleOutpainting = () => callGeminiAI("Expand the image to fill the canvas.", "outpainting");

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="shrink-0">
        <Header 
          onDownload={handleDownload}
          onClear={handleClear}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onResize={handleResize}
          onCrop={handleCrop}
          isCropping={isCropping}
          setIsCropping={setIsCropping}
          setCropRect={setCropRect}
          canUndo={history.length > 0}
          canRedo={redoStack.length > 0}
          canvasSize={image ? { 
            width: Math.round(canvasRef.current?.width || image.width), 
            height: Math.round(canvasRef.current?.height || image.height) 
          } : undefined}
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900/90 backdrop-blur-sm overflow-auto relative min-h-[300px]">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm aspect-video border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all group"
            >
              <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 text-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider">Upload Image</h3>
                <p className="text-[8px] text-slate-500">PNG, JPG, WEBP</p>
              </div>
            </div>
          ) : (
            <div 
              className="relative shadow-2xl border-4 border-white dark:border-slate-800 rounded-lg max-w-full max-h-full transition-transform duration-200 ease-out" 
              style={{ transform: `scale(${editorState.zoom})`, cursor: draggingTextId ? 'grabbing' : 'default' }}
            >
              <canvas 
                ref={canvasRef} 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                className="max-w-full max-h-[60vh] lg:max-h-[75vh] object-contain touch-none" 
              />
              <canvas 
                ref={maskCanvasRef}
                className="absolute inset-0 pointer-events-none opacity-50 max-w-full max-h-[60vh] lg:max-h-[75vh] object-contain"
                style={{ display: isMaskingActive ? 'block' : 'none' }}
              />
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-full shadow-xl backdrop-blur z-10">
                <button onClick={() => updateState('zoom', Math.max(0.1, editorState.zoom - 0.1))} className="p-3 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Minus size={20} /></button>
                <span className="text-[10px] font-bold w-10 text-center text-slate-700 dark:text-slate-200">{Math.round(editorState.zoom * 100)}%</span>
                <button onClick={() => updateState('zoom', Math.min(5, editorState.zoom + 0.1))} className="p-3 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><Plus size={20} /></button>
                <button onClick={() => updateState('zoom', 1)} className="p-3 border-l dark:border-slate-700 text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-full transition"><Maximize size={20} /></button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>

        {/* Tools Panel */}
        <div className="w-full lg:w-80 bg-white dark:bg-[#1a2332] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-5 space-y-6 overflow-y-auto no-scrollbar pb-24 lg:pb-6 h-[40vh] lg:h-auto text-slate-700 dark:text-slate-200">
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">Adjustments</h3>
            <div className="space-y-4">
              {['brightness', 'contrast', 'saturation', 'blur'].map((f) => (
                <div key={f} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    <span className="capitalize">{f}</span>
                    <span className="text-blue-500 dark:text-blue-400">{editorState[f as keyof EditorState] as number}</span>
                  </div>
                  <input 
                    type="range" 
                    min={f === 'blur' ? 0 : -100} max={f === 'blur' ? 20 : 100} 
                    value={editorState[f as keyof EditorState] as number}
                    onMouseDown={handleSliderStart}
                    onTouchStart={handleSliderStart}
                    onChange={(e) => updateState(f as keyof EditorState, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">EFFECTS</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Normal', value: 'none' },
                { label: 'B&W', value: 'grayscale(100%)' },
                { label: 'Sepia', value: 'sepia(100%)' },
                { label: 'Vintage', value: 'sepia(50%) contrast(120%) saturate(80%)' }
              ].map(f => (
                <button 
                  key={f.label} 
                  onClick={() => { saveToHistory(); updateState('filter', f.value); }}
                  className={`py-2 px-1 rounded-md border text-[10px] font-bold transition ${editorState.filter === f.value ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {f.label}
                </button>
              ))}
              <button 
                onClick={() => { saveToHistory(); updateState('rotation', (editorState.rotation + 90) % 360); }}
                className="col-span-2 py-2 px-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
              >
                <RotateCw size={12} /> Rotate
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button 
                onClick={handleRemoveBackground}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20`}
              >
                <Eraser size={14} /> Hapus Background (AI)
              </button>

              <div className="space-y-2">
                <button 
                  onClick={() => setActiveAiTool(activeAiTool === 'replace_bg' ? null : 'replace_bg')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition ${activeAiTool === 'replace_bg' ? 'border-blue-500 bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'}`}
                >
                  <PaintBucket size={14} /> Ganti Background (AI)
                </button>
                {activeAiTool === 'replace_bg' && (
                  <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pilih Latar / Prompter</p>
                    <div className="flex gap-2">
                      {['#ef4444', '#3b82f6', '#ffffff', '#94a3b8'].map(color => (
                        <button 
                          key={color} 
                          onClick={() => { setBgPrompt(`solid ${color} background`); handleReplaceBackground(); }}
                          className="w-6 h-6 rounded-full border border-slate-300 dark:border-white/20" 
                          style={{ backgroundColor: color }} 
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Custom: cth. pantai..." 
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-[10px] outline-none focus:border-blue-500 dark:text-white"
                        value={bgPrompt}
                        onChange={(e) => setBgPrompt(e.target.value)}
                      />
                      <button 
                        onClick={handleReplaceBackground}
                        className="p-1.5 bg-blue-600 rounded text-white hover:bg-blue-500 transition"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setActiveAiTool(activeAiTool === 'magic_edit' ? null : 'magic_edit')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition ${activeAiTool === 'magic_edit' ? 'border-pink-500 bg-pink-500/20 text-pink-600 dark:text-pink-400' : 'border-pink-100 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/10 hover:bg-pink-100 dark:hover:bg-pink-900/20'}`}
                >
                  <Sparkles size={14} /> Seleksi dan Ubah (AI)
                </button>
                {activeAiTool === 'magic_edit' && (
                  <div className="p-4 rounded-xl border border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-950/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => setIsMaskingActive(!isMaskingActive)}
                      className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border text-[10px] font-bold transition ${isMaskingActive ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                      <Scissors size={14} /> {isMaskingActive ? 'Nonaktifkan Kuas' : 'Aktifkan Kuas Masking'}
                    </button>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <span>Ukuran Kuas</span>
                        <span>{brushSize}</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" max="100" 
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-pink-200 dark:bg-pink-900/30 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const ctx = maskCanvasRef.current?.getContext('2d');
                        ctx?.clearRect(0, 0, maskCanvasRef.current?.width || 0, maskCanvasRef.current?.height || 0);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-100 transition"
                    >
                      <Eraser size={14} /> Hapus Masker
                    </button>

                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">INSTRUKSI EDIT</p>
                      <textarea 
                        placeholder="Contoh: Tambahkan kacamata hitam, ubah jadi bunga..." 
                        className="w-full bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800 rounded-lg p-3 text-[10px] outline-none focus:ring-2 ring-pink-500/20 dark:text-white h-20 resize-none"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                      />
                    </div>
                    
                    <button 
                      onClick={handleMagicEdit}
                      className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-pink-500/20"
                    >
                      <Sparkles size={16} /> Generate Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setActiveAiTool(activeAiTool === 'outpainting' ? null : 'outpainting')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition ${activeAiTool === 'outpainting' ? 'border-teal-500 bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'border-teal-100 dark:border-teal-900/30 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/20'}`}
                >
                  <Maximize size={14} /> Perluas Foto (Outpainting)
                </button>
                {activeAiTool === 'outpainting' && (
                  <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-950/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-2">
                      <input 
                        type="checkbox" 
                        className="mt-1 accent-teal-500 cursor-pointer" 
                        id="outpaint-mode" 
                        checked={isOutpaintingActive}
                        onChange={(e) => setIsOutpaintingActive(e.target.checked)}
                      />
                      <label htmlFor="outpaint-mode" className="text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                        Mode Perluas (Outpainting)
                        <p className="font-normal text-slate-500 dark:text-slate-400 normal-case mt-0.5">Tarik bingkai (handles) di layar atau atur ukuran canvas di atas untuk memperluas area foto. AI akan mengisi area kosong.</p>
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Zoom Out</span>
                        <span>{outpaintingZoom}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" max="200" 
                        value={outpaintingZoom}
                        onChange={(e) => setOutpaintingZoom(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                    </div>
                    <button 
                      onClick={handleOutpainting}
                      className="w-full py-2 bg-teal-600 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-2 hover:bg-teal-500 transition"
                    >
                      <Sparkles size={14} /> Generate Isi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TypeIcon size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ADD TEXT</h3>
            </div>
            
            <div className="space-y-4">
              <textarea 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Tulis sesuatu... (Enter untuk baris baru)" 
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none h-20 focus:border-blue-500 dark:text-white transition" 
              />
              
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">JENIS FONT</p>
                <select 
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Ukuran</span>
                    <span>{textSize}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" max="200" 
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Rotasi</span>
                    <span>{textRotation}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="360" 
                    value={textRotation}
                    onChange={(e) => setTextRotation(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[
                    { icon: Bold, state: isBold, set: setIsBold },
                    { icon: Italic, state: isItalic, set: setIsItalic },
                    { icon: Underline, state: isUnderline, set: setIsUnderline }
                  ].map((btn, i) => (
                    <button 
                      key={i}
                      onClick={() => btn.set(!btn.state)}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition ${btn.state ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <btn.icon size={14} />
                    </button>
                  ))}
                  <button 
                    onClick={() => setHasShadow(!hasShadow)}
                    className={`w-8 h-8 rounded border flex items-center justify-center transition font-bold text-xs ${hasShadow ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    S
                  </button>
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                <div className="flex gap-1">
                  {[
                    { icon: AlignLeft, value: 'left' },
                    { icon: AlignCenter, value: 'center' },
                    { icon: AlignRight, value: 'right' }
                  ].map((btn, i) => (
                    <button 
                      key={i}
                      onClick={() => setTextAlign(btn.value as any)}
                      className={`w-8 h-8 rounded border flex items-center justify-center transition ${textAlign === btn.value ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <btn.icon size={14} />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => colorInputRef.current?.click()}
                className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition dark:text-white relative overflow-hidden"
              >
                <input 
                  ref={colorInputRef}
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20" style={{ backgroundColor: textColor }} />
                PILIH WARNA TEKS
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={handleAddTextLayer}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-95 transition shadow-lg shadow-blue-900/20"
                >
                  <PlusCircle size={16} /> ADD TEXT
                </button>
                
                {selectedTextId && (
                  <button 
                    onClick={() => {
                      saveToHistory();
                      setEditorState(prev => ({
                        ...prev,
                        texts: prev.texts.filter(t => t.id !== selectedTextId)
                      }));
                      setSelectedTextId(null);
                    }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition active:scale-95"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EditorTab;
