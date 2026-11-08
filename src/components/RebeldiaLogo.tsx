import React, { useState, useEffect } from 'react';
import { getCustomLogo } from '../utils/logo';

interface RebeldiaLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'badge';
  pinkColor?: string;
  fmColor?: string;
  eyeColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  customLogoUrl?: string | null;
}

export const RebeldiaLogo: React.FC<RebeldiaLogoProps> = ({
  className = '',
  variant = 'full',
  pinkColor = '#FF007F',
  fmColor = '#707070',
  eyeColor = '#707070',
  size = 'md',
  showSlogan = false,
  customLogoUrl,
}) => {
  const [activeCustomLogo, setActiveCustomLogo] = useState<string>(() => {
    if (customLogoUrl) return customLogoUrl;
    return getCustomLogo() || '/reb_mascot.jpg';
  });

  useEffect(() => {
    if (customLogoUrl) {
      setActiveCustomLogo(customLogoUrl);
      return;
    }

    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setActiveCustomLogo(customEvent.detail || getCustomLogo() || '/reb_mascot.jpg');
    };

    window.addEventListener('rebeldia_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('rebeldia_logo_updated', handleLogoUpdate);
  }, [customLogoUrl]);

  // Height presets
  const heightClasses = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  const currentHeight = heightClasses[size] || 'h-10';
  const logoSrc = activeCustomLogo || '/reb_mascot.jpg';

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src={logoSrc}
          alt="Logotipo da Emissora"
          className={`${currentHeight} w-auto max-w-full object-contain drop-shadow-md rounded-full`}
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center p-1.5 rounded-2xl bg-zinc-950 border border-white/10 ${className}`}>
        <img
          src={logoSrc}
          alt="Logotipo da Emissora"
          className={`${currentHeight} w-auto max-w-full object-contain drop-shadow-md rounded-md`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <img
        src={logoSrc}
        alt="Logotipo Rebeldia FM"
        className={`${currentHeight} w-auto max-w-full object-contain drop-shadow-md rounded-md`}
      />
      {showSlogan && (
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1 font-sans">
          radio LIVRE
        </span>
      )}
    </div>
  );
};

