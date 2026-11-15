import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  title?: string;
}

/**
 * Displays a song title cleanly and, whenever the text exceeds its container width,
 * animates it slowly back and forth (ping-pong marquee) so the full title is readable.
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  align = 'left',
  title,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [overflowPx, setOverflowPx] = useState(0);

  const measure = () => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const diff = Math.ceil(textEl.scrollWidth - container.clientWidth);
    if (diff > 2) {
      setOverflowPx(diff + 4);
    } else {
      setOverflowPx(0);
    }
  };

  useLayoutEffect(() => {
    measure();
  }, [text]);

  useEffect(() => {
    let active = true;
    const handleResize = () => {
      if (active) measure();
    };

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (active) measure();
          })
        : null;

    if (observer) {
      if (containerRef.current) observer.observe(containerRef.current);
      if (textRef.current) observer.observe(textRef.current);
    }

    window.addEventListener('resize', handleResize);
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (active) measure();
      }).catch(() => {});
    }

    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [text]);

  const isOverflowing = overflowPx > 0;
  const durationSec = isOverflowing
    ? Math.max(9, Math.min(28, Number((overflowPx / 20 / 0.3).toFixed(1))))
    : 0;

  const alignClass = isOverflowing
    ? 'text-left'
    : align === 'center'
    ? 'text-center'
    : align === 'right'
    ? 'text-right'
    : 'text-left';

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 overflow-hidden whitespace-nowrap ${alignClass} ${className}`}
      title={title ?? text}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${
          isOverflowing ? 'animate-marquee-pingpong will-change-transform' : ''
        }`}
        style={
          isOverflowing
            ? ({
                '--marquee-offset': `-${overflowPx}px`,
                '--marquee-duration': `${durationSec}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
};
