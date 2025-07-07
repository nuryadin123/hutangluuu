'use client';

import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingAddButton() {
  const router = useRouter();
  const fabRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [position, setPosition] = useState({ x: 32, y: 0 }); // Initial y will be set in useEffect
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Position button at the bottom right on initial load
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });

    const handleResize = () => {
        if (fabRef.current) {
            setPosition(prevPos => ({
                x: Math.min(prevPos.x, window.innerWidth - fabRef.current!.offsetWidth - 16),
                y: Math.min(prevPos.y, window.innerHeight - fabRef.current!.offsetHeight - 16),
            }));
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDragStart = (clientX: number, clientY: number) => {
    if (fabRef.current) {
      setIsDragging(true);
      // Use a timeout to distinguish between a click and a drag
      setTimeout(() => setWasDragged(false), 0);
      const rect = fabRef.current.getBoundingClientRect();
      setOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    }
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    onDragStart(e.clientX, e.clientY);
  };
  
  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    onDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onDragMove = (clientX: number, clientY: number) => {
    if (isDragging && fabRef.current) {
      setWasDragged(true);
      const padding = 16;
      let newX = clientX - offset.x;
      let newY = clientY - offset.y;

      const fabWidth = fabRef.current.offsetWidth;
      const fabHeight = fabRef.current.offsetHeight;

      newX = Math.max(padding, Math.min(newX, window.innerWidth - fabWidth - padding));
      newY = Math.max(padding, Math.min(newY, window.innerHeight - fabHeight - padding));

      setPosition({ x: newX, y: newY });
    }
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const moveHandler = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        if ('touches' in e) {
          onDragMove(e.touches[0].clientX, e.touches[0].clientY);
        } else {
          onDragMove(e.clientX, e.clientY);
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', moveHandler as any);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', moveHandler as any);
      document.addEventListener('touchend', onDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', moveHandler as any);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', moveHandler as any);
      document.removeEventListener('touchend', onDragEnd);
    };
  }, [isDragging, offset.x, offset.y]);

  const handleClick = () => {
    if (!wasDragged) {
      router.push('/add');
    }
  };
  
  if (!isClient) {
    return null; // Don't render on the server
  }

  return (
    <div
      ref={fabRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={cn(
        'fixed z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform duration-200 ease-in-out',
        isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
    >
      <Plus className="w-6 h-6" />
      <span className="sr-only">Tambah Catatan Baru</span>
    </div>
  );
}
