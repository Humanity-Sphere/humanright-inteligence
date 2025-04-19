import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';

interface DrawingCanvasProps {
  onDrawingComplete: (imageData: string) => void;
  onClose: () => void;
}

export function DrawingCanvas({ onDrawingComplete, onClose }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    setIsDrawing(true);
    
    let x: number, y: number;
    if ('touches' in e) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // For touch events, calculate the scale and apply it
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      // For mouse events, use the offsetX/Y directly
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleX;
    }
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    e.preventDefault(); // Prevent scrolling on mobile

    let x: number, y: number;
    if ('touches' in e) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // For touch events, calculate the scale and apply it
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      // For mouse events, use the offsetX/Y directly
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleX;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/jpeg');
    onDrawingComplete(imageData);
  };

  const handleClear = () => {
    if (!context || !canvasRef.current) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 touch-none">
      <div className="bg-background p-4 rounded-lg w-full max-w-[400px]">
        <div className="flex flex-col gap-4">
          <canvas
            ref={canvasRef}
            width={300}
            height={500}
            className="border border-border rounded-lg cursor-crosshair bg-white w-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={handleClear} className="min-w-[60px]">
              Clear
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="min-w-[60px]">
                Cancel
              </Button>
              <Button onClick={handleComplete} className="min-w-[60px]">
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
