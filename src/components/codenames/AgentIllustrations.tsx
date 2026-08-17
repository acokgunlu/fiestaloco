import React from 'react';

interface AgentArtProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

// 1. RED AGENT: Covert Intelligence Operative with Trenchcoat, Fedora/Hat, Sunglasses & Ruby Laser Comm
export const RedAgentArt: React.FC<AgentArtProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    full: 'w-full h-full',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="redCoatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="50%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>
          <linearGradient id="redHatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
          <linearGradient id="redGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Badge Background Circle */}
        <circle cx="50" cy="50" r="46" fill="url(#redCoatGrad)" stroke="#fecdd3" strokeWidth="2.5" />
        
        {/* Subtle Crosshair Reticle in Background */}
        <circle cx="50" cy="50" r="38" stroke="#ffe4e6" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="50" y1="8" x2="50" y2="20" stroke="#ffe4e6" strokeWidth="1.5" opacity="0.6" />
        <line x1="50" y1="80" x2="50" y2="92" stroke="#ffe4e6" strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="50" x2="20" y2="50" stroke="#ffe4e6" strokeWidth="1.5" opacity="0.6" />
        <line x1="80" y1="50" x2="92" y2="50" stroke="#ffe4e6" strokeWidth="1.5" opacity="0.6" />

        {/* Trenchcoat Collar & Shoulders */}
        <path
          d="M20 88 C20 70 32 62 50 62 C68 62 80 70 80 88 Z"
          fill="url(#redHatGrad)"
          stroke="#ffe4e6"
          strokeWidth="1.5"
        />
        {/* Coat Lapels */}
        <path d="M38 62 L46 76 L50 88 L54 76 L62 62" fill="#4c0519" stroke="#fda4af" strokeWidth="1" />
        {/* Tie */}
        <path d="M48 64 L52 64 L53 78 L50 83 L47 78 Z" fill="#fb7185" />

        {/* Head / Face */}
        <ellipse cx="50" cy="46" rx="14" ry="16" fill="#fbcfe8" />
        {/* Shadow under hat */}
        <path d="M36 42 Q50 48 64 42 L64 36 Q50 38 36 36 Z" fill="rgba(76,5,25,0.4)" />

        {/* Fedora / Spy Hat Brim */}
        <path
          d="M24 35 Q50 26 76 35 Q50 31 24 35 Z"
          fill="url(#redHatGrad)"
          stroke="#fda4af"
          strokeWidth="1.5"
        />
        {/* Hat Crown */}
        <path
          d="M34 33 C33 22 40 16 50 16 C60 16 67 22 66 33 Z"
          fill="url(#redHatGrad)"
          stroke="#fda4af"
          strokeWidth="1.5"
        />
        {/* Hat Ribbon */}
        <path d="M33 30 Q50 28 67 30 L66 33 Q50 31 34 33 Z" fill="#e11d48" />

        {/* Dark Spy Sunglasses */}
        <rect x="38" y="42" width="10" height="7" rx="2" fill="url(#redGlassGrad)" stroke="#fda4af" strokeWidth="0.8" />
        <rect x="52" y="42" width="10" height="7" rx="2" fill="url(#redGlassGrad)" stroke="#fda4af" strokeWidth="0.8" />
        <line x1="48" y1="45" x2="52" y2="45" stroke="#fda4af" strokeWidth="1.5" />
        {/* Sunglasses Reflection */}
        <line x1="40" y1="43" x2="44" y2="47" stroke="#fb7185" strokeWidth="1" strokeLinecap="round" />
        <line x1="54" y1="43" x2="58" y2="47" stroke="#fb7185" strokeWidth="1" strokeLinecap="round" />

        {/* Stealth Earpiece */}
        <circle cx="64" cy="48" r="2" fill="#fb7185" />
        <path d="M64 50 Q66 58 60 62" stroke="#fda4af" strokeWidth="1" strokeDasharray="1 1" fill="none" />
      </svg>
    </div>
  );
};

// 2. BLUE AGENT: Cyber & Tactical Intelligence Operative with Stealth Visor, Headset & Blue Glow
export const BlueAgentArt: React.FC<AgentArtProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    full: 'w-full h-full',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="blueSuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="blueArmorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="cyberVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Badge Background Circle */}
        <circle cx="50" cy="50" r="46" fill="url(#blueSuitGrad)" stroke="#bfdbfe" strokeWidth="2.5" />

        {/* Digital Radar / Cyber Grid Lines */}
        <circle cx="50" cy="50" r="38" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
        <polygon points="50,14 86,50 50,86 14,50" stroke="#60a5fa" strokeWidth="1" opacity="0.3" fill="none" />

        {/* High-Tech Tactical Armor & Shoulders */}
        <path
          d="M20 88 C20 68 32 60 50 60 C68 60 80 68 80 88 Z"
          fill="url(#blueArmorGrad)"
          stroke="#93c5fd"
          strokeWidth="1.5"
        />
        {/* Armor Plates */}
        <path d="M34 68 L50 78 L66 68" stroke="#38bdf8" strokeWidth="2" fill="none" />
        <circle cx="50" cy="78" r="3" fill="#38bdf8" />

        {/* Head / Jaw */}
        <ellipse cx="50" cy="45" rx="14" ry="16" fill="#e0f2fe" />
        {/* Sleek Short Hair / Stealth Hood */}
        <path d="M35 42 C34 26 44 20 50 20 C56 20 66 26 65 42 C62 30 38 30 35 42 Z" fill="#0f172a" />

        {/* Cyber Visor / High-Tech HUD Glasses */}
        <path
          d="M34 38 Q50 42 66 38 L65 48 Q50 52 35 48 Z"
          fill="url(#cyberVisorGrad)"
          stroke="#e0f2fe"
          strokeWidth="1.2"
        />
        {/* HUD Glow line */}
        <line x1="38" y1="43" x2="62" y2="43" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
        <circle cx="58" cy="43" r="1.5" fill="#facc15" />

        {/* Tactical Comm Headset */}
        <rect x="31" y="40" width="4" height="10" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
        <path d="M33 50 Q36 60 44 60" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="45" cy="60" r="2" fill="#38bdf8" />
      </svg>
    </div>
  );
};

// 3. INNOCENT CIVILIAN: Neutral Bystander holding Newspaper & Coffee Cup
export const CivilianArt: React.FC<AgentArtProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    full: 'w-full h-full',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="civBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="civClothesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Badge Background Circle */}
        <circle cx="50" cy="50" r="46" fill="url(#civBgGrad)" stroke="#f1f5f9" strokeWidth="2.5" />

        {/* Civilian Casual Clothes */}
        <path
          d="M22 88 C22 70 34 62 50 62 C66 62 78 70 78 88 Z"
          fill="url(#civClothesGrad)"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        {/* Sweater Collar */}
        <circle cx="50" cy="62" r="6" fill="#f8fafc" />

        {/* Head */}
        <ellipse cx="50" cy="44" rx="14" ry="16" fill="#fed7aa" />
        {/* Normal Hair */}
        <path d="M35 40 C34 26 44 22 50 22 C56 22 66 26 65 40 C61 32 39 32 35 40 Z" fill="#78350f" />

        {/* Friendly Glasses */}
        <circle cx="43" cy="43" r="5" stroke="#334155" strokeWidth="1.5" fill="rgba(255,255,255,0.4)" />
        <circle cx="57" cy="43" r="5" stroke="#334155" strokeWidth="1.5" fill="rgba(255,255,255,0.4)" />
        <line x1="48" y1="43" x2="52" y2="43" stroke="#334155" strokeWidth="1.5" />

        {/* Normal smile */}
        <path d="M46 52 Q50 56 54 52" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Newspaper in Hands */}
        <rect x="32" y="70" width="36" height="18" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
        <line x1="36" y1="74" x2="64" y2="74" stroke="#64748b" strokeWidth="1.5" />
        <line x1="36" y1="78" x2="56" y2="78" stroke="#94a3b8" strokeWidth="1" />
        <line x1="36" y1="82" x2="60" y2="82" stroke="#94a3b8" strokeWidth="1" />
      </svg>
    </div>
  );
};

// 4. BLACK ASSASSIN: Lethal Cloaked Hitman with Skull/Shadow Mask & Crimson Glares
export const AssassinArt: React.FC<AgentArtProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    full: 'w-full h-full',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          <linearGradient id="assassinBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#09090b" />
            <stop offset="50%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <radialGradient id="assassinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Badge Background Circle with Dark Border */}
        <circle cx="50" cy="50" r="46" fill="url(#assassinBgGrad)" stroke="#e11d48" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="44" fill="url(#assassinGlow)" />

        {/* Skull Crossbones Danger Icon Behind */}
        <line x1="28" y1="28" x2="72" y2="72" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="28" x2="28" y2="72" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round" />

        {/* Assassin Cloaked Hood & Shoulders */}
        <path
          d="M18 90 C18 64 30 52 50 52 C70 52 82 64 82 90 Z"
          fill="#09090b"
          stroke="#27272a"
          strokeWidth="2"
        />

        {/* Dark Hood Peak */}
        <path
          d="M28 50 C26 28 38 15 50 14 C62 15 74 28 72 50 C66 40 34 40 28 50 Z"
          fill="#18181b"
          stroke="#e11d48"
          strokeWidth="1.5"
        />

        {/* Face Void Shadow */}
        <ellipse cx="50" cy="44" rx="14" ry="15" fill="#000000" />

        {/* Piercing Crimson Glowing Eyes */}
        <polygon points="41,41 47,44 41,47 43,44" fill="#ef4444" filter="drop-shadow(0 0 4px #ef4444)" />
        <polygon points="59,41 53,44 59,47 57,44" fill="#ef4444" filter="drop-shadow(0 0 4px #ef4444)" />

        {/* Menacing Skull Mask Nose & Teeth lines */}
        <path d="M49 48 L51 48 L50 51 Z" fill="#52525b" />
        <line x1="44" y1="55" x2="56" y2="55" stroke="#e11d48" strokeWidth="1" />
        <line x1="46" y1="53" x2="46" y2="57" stroke="#e11d48" strokeWidth="1" />
        <line x1="50" y1="53" x2="50" y2="57" stroke="#e11d48" strokeWidth="1" />
        <line x1="54" y1="53" x2="54" y2="57" stroke="#e11d48" strokeWidth="1" />
      </svg>
    </div>
  );
};
