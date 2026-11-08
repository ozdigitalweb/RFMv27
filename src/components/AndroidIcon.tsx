import React from 'react';

interface AndroidIconProps {
  className?: string;
  size?: number | string;
}

/**
 * Android Mascot (Full Body) matching the user's provided graphic:
 * - Antennas angled outward with rounded tips
 * - Green dome head with glossy highlight and white circular eyes
 * - Horizontal neck divider
 * - Torso with curved two-tone glossy green highlight
 * - Pill-shaped arms and legs
 */
export const AndroidIcon: React.FC<AndroidIconProps> = ({
  className = 'w-5 h-5',
}) => {
  return (
    <svg
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradients for authentic 3D gloss Android look */}
        <linearGradient id="andrHeadGrad" x1="50" y1="12" x2="50" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7CD034" />
          <stop offset="60%" stopColor="#55BA20" />
          <stop offset="100%" stopColor="#3EA712" />
        </linearGradient>

        <linearGradient id="andrGlossGrad" x1="50" y1="10" x2="50" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="andrBodyGrad" x1="50" y1="38" x2="50" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#62C723" />
          <stop offset="45%" stopColor="#43B015" />
          <stop offset="100%" stopColor="#1E8C0C" />
        </linearGradient>

        <linearGradient id="andrLimbGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BBE1E" />
          <stop offset="100%" stopColor="#25920E" />
        </linearGradient>
      </defs>

      <g>
        {/* Antennas */}
        <line
          x1="34"
          y1="17"
          x2="25"
          y2="4"
          stroke="#68C725"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="66"
          y1="17"
          x2="75"
          y2="4"
          stroke="#68C725"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Head Dome */}
        <path
          d="M23 34 C23 18 34.5 13 50 13 C65.5 13 77 18 77 34 Z"
          fill="url(#andrHeadGrad)"
        />
        {/* Head Gloss Highlight */}
        <path
          d="M24 34 C25 20 35 14.5 50 14.5 C65 14.5 75 20 76 34 Z"
          fill="url(#andrGlossGrad)"
          opacity="0.75"
        />

        {/* White Circular Eyes */}
        <circle cx="36.5" cy="25" r="3.2" fill="#FFFFFF" />
        <circle cx="63.5" cy="25" r="3.2" fill="#FFFFFF" />

        {/* Torso Base */}
        <path
          d="M23 38.5 H77 V73 C77 78 72.5 82 67 82 H33 C27.5 82 23 78 23 73 Z"
          fill="url(#andrBodyGrad)"
        />

        {/* Two-tone curved glossy top portion of torso (as seen in uploaded image) */}
        <path
          d="M23 38.5 H77 V53 C66 60 34 60 23 53 Z"
          fill="#7CD034"
        />
        <path
          d="M23 38.5 H77 V48 C66 53 34 53 23 48 Z"
          fill="url(#andrGlossGrad)"
          opacity="0.65"
        />

        {/* Left Arm */}
        <rect
          x="10.5"
          y="38.5"
          width="9.5"
          height="32"
          rx="4.75"
          fill="url(#andrLimbGrad)"
        />

        {/* Right Arm */}
        <rect
          x="80"
          y="38.5"
          width="9.5"
          height="32"
          rx="4.75"
          fill="url(#andrLimbGrad)"
        />

        {/* Left Leg */}
        <rect
          x="33.5"
          y="82"
          width="10"
          height="23"
          rx="5"
          fill="url(#andrLimbGrad)"
        />

        {/* Right Leg */}
        <rect
          x="56.5"
          y="82"
          width="10"
          height="23"
          rx="5"
          fill="url(#andrLimbGrad)"
        />
      </g>
    </svg>
  );
};

