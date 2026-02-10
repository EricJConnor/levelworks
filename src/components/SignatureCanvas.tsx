import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface SignatureCanvasProps {
  onSave?: (signature: string) => void;
  onChange?: (signature: string) => void;
  showButtons?: boolean;
}

export interface SignatureCanvasRef {
  getSignature: () => string | null;
  clear: () => void;
  hasSignature: () => boolean;
}

/**
 * Compress a base64 image to reduce storage size
 * Uses canvas resizing and JPEG compression
 */
const compressSignature = (dataUrl: string, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Create a temporary canvas for compression
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl); // Fallback to original
        return;
      }
      
      // Fill with white background (for JPEG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as compressed JPEG
      const compressed = canvas.toDataURL('image/jpeg', quality);
      
      console.log(`[SignatureCanvas] Compressed from ${Math.round(dataUrl.length / 1024)}KB to ${Math.round(compressed.length / 1024)}KB`);
      
      resolve(compressed);
    };
    
    img.onerror = () => {
      resolve(dataUrl); // Fallback to original on error
    };
    
    img.src = dataUrl;
  });
};

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSave, onChange, showButtons = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      getSignature: () => {
        if (!hasDrawn) return null;
        const canvas = canvasRef.current;
        if (!canvas) return null;
        // Return PNG for better quality when getting signature
        return canvas.toDataURL('image/png');
      },
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      },
      hasSignature: () => hasDrawn
    }));

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      if ('touches' in e) {
        return { 
          x: (e.touches[0].clientX - rect.left) * scaleX, 
          y: (e.touches[0].clientY - rect.top) * scaleY 
        };
      }
      return { 
        x: (e.clientX - rect.left) * scaleX, 
        y: (e.clientY - rect.top) * scaleY 
      };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const { x, y } = getCoords(e);
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.beginPath();
      ctx?.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      if (!hasDrawn) setHasDrawn(true);
      const { x, y } = getCoords(e);
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.lineTo(x, y);
      ctx?.stroke();
    };

    const stopDrawing = async () => {
      if (isDrawing && hasDrawn) {
        // Auto-notify parent when drawing stops with compressed signature
        const canvas = canvasRef.current;
        if (canvas && onChange) {
          const rawData = canvas.toDataURL('image/png');
          // Compress the signature before sending to parent
          const compressed = await compressSignature(rawData, 400, 0.8);
          onChange(compressed);
        }
      }
      setIsDrawing(false);
    };

    const clear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      if (onChange) onChange('');
    };

    const save = async () => {
      if (!hasDrawn) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (onSave) {
        const rawData = canvas.toDataURL('image/png');
        // Compress before saving
        const compressed = await compressSignature(rawData, 400, 0.8);
        onSave(compressed);
      }
    };

    return (
      <div className="space-y-3">
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative">
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={150} 
            className="w-full cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing} 
            onMouseMove={draw} 
            onMouseUp={stopDrawing} 
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} 
            onTouchMove={draw} 
            onTouchEnd={stopDrawing} 
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-lg">Sign here</p>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 text-center">Draw your signature above using your finger or mouse</p>
        {showButtons && (
          <div className="flex gap-3">
            <button 
              onClick={clear} 
              type="button" 
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            {onSave && (
              <button 
                onClick={save} 
                type="button" 
                disabled={!hasDrawn} 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Signature
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';
