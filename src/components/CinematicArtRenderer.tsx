import React from 'react';
import { CanvasNodeData } from '../types/canvas';

interface CinematicArtProps {
  nodeType: 'character' | 'scene_asset' | 'storyboard';
  data: CanvasNodeData;
  upstreamAnchorCount?: number;
  compact?: boolean;
}

/**
 * High-contrast editorial & film-noir SVG synthesizer for:
 * 1) Character Three-View Consistency Sheets (Front / Side Profile / Facial Close-Up Lock)
 * 2) Scene Environment Perspective Blueprints
 * 3) 9:16 & 16:9 Storyboard Frames with camera reticles, motion vectors, and lighting composition
 */
export const CinematicArtRenderer: React.FC<CinematicArtProps> = ({
  nodeType,
  data,
  upstreamAnchorCount = 0,
  compact = false,
}) => {
  // 1. Character Consistency Three-View Sheet
  if (nodeType === 'character') {
    const isMale = data.visualPreset === 'lu_chen' || data.title?.includes('陆沉');
    const accent = data.colorPalette?.[2] || (isMale ? '#F59E0B' : '#38BDF8');

    return (
      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-[#09090B] border border-zinc-800 select-none">
        <svg
          viewBox="0 0 360 150"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`bg-${data.title}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#09090B" />
              <stop offset="100%" stopColor="#18181B" />
            </linearGradient>
            <radialGradient id={`glow-${data.title}`} cx="0.5" cy="0.4" r="0.5">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="360" height="150" fill={`url(#bg-${data.title})`} />
          <circle cx="290" cy="70" r="65" fill={`url(#glow-${data.title})`} />

          {/* Architectural Proportion Grid Lines */}
          <line x1="0" y1="28" x2="360" y2="28" stroke="#27272A" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="0" y1="75" x2="360" y2="75" stroke="#27272A" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="0" y1="128" x2="360" y2="128" stroke="#27272A" strokeWidth="0.5" />
          <line x1="115" y1="12" x2="115" y2="138" stroke="#27272A" strokeWidth="0.6" />
          <line x1="220" y1="12" x2="220" y2="138" stroke="#27272A" strokeWidth="0.6" />

          {/* View 1: FRONT FULL/HALF VIEW */}
          <text x="14" y="20" fill="#A1A1AA" fontSize="8" fontFamily="JetBrains Mono">
            01. FRONT VIEW
          </text>
          <g transform="translate(58, 34)">
            {/* Head & Hair Silhouette */}
            <circle cx="0" cy="16" r="12" fill="#E4E4E7" />
            {isMale ? (
              <path d="M-12,14 Q0,2 12,14 L10,8 Q0,4 -10,8 Z" fill="#09090B" />
            ) : (
              <path d="M-13,14 Q0,0 13,14 L15,36 L10,36 L10,18 L-10,18 L-10,36 L-15,36 Z" fill="#18181B" />
            )}
            {/* Trench Coat / Gown Shoulders */}
            <path
              d="M-24,92 L-19,36 Q0,30 19,36 L24,92 Z"
              fill={isMale ? '#18181B' : '#D4D4D8'}
              stroke={accent}
              strokeWidth="1"
            />
            {/* Lapel / Collar detail */}
            <path d="M-7,34 L0,56 L7,34" fill="none" stroke={accent} strokeWidth="1.2" />
          </g>

          {/* View 2: SIDE PROFILE */}
          <text x="125" y="20" fill="#A1A1AA" fontSize="8" fontFamily="JetBrains Mono">
            02. PROFILE 90°
          </text>
          <g transform="translate(168, 34)">
            <circle cx="0" cy="16" r="11.5" fill="#D4D4D8" />
            {/* Profile Nose & Jawline */}
            <path d="M9,11 L14,17 L10,20 L10,25 L2,27" fill="none" stroke={accent} strokeWidth="1.2" />
            <path
              d="M-14,92 L-10,36 Q2,32 12,38 L16,92 Z"
              fill="#27272A"
              stroke="#71717A"
              strokeWidth="1"
            />
          </g>

          {/* View 3: FACIAL ANCHOR LOCK CLOSE-UP */}
          <text x="230" y="20" fill={accent} fontSize="8" fontFamily="JetBrains Mono">
            03. FACE LOCK ANCHOR
          </text>
          <g transform="translate(290, 76)">
            {/* Face Reticle */}
            <rect x="-42" y="-38" width="84" height="72" rx="4" fill="#09090B" fillOpacity="0.6" stroke={accent} strokeWidth="0.9" strokeDasharray="4 2" />
            {/* Stylized High-Contrast Portrait Close-Up */}
            <ellipse cx="0" cy="-2" rx="22" ry="26" fill="#E4E4E7" />
            {/* Eyes with Catchlight */}
            <line x1="-12" y1="-5" x2="-4" y2="-5" stroke="#09090B" strokeWidth="2" />
            <line x1="4" y1="-5" x2="12" y2="-5" stroke="#09090B" strokeWidth="2" />
            <circle cx="-7" cy="-5.5" r="1.2" fill={accent} />
            <circle cx="9" cy="-5.5" r="1.2" fill={accent} />
            {/* Key Prop Indicator */}
            <circle cx="26" cy="18" r="9" fill="#09090B" stroke={accent} strokeWidth="1.2" />
            <circle cx="26" cy="18" r="2" fill={accent} />
          </g>

          {/* Bottom Swatches & Verification */}
          <text x="14" y="142" fill="#A1A1AA" fontSize="8" fontFamily="JetBrains Mono">
            LOCKED ID: {data.visualPreset?.toUpperCase() || 'CHAR_REF_01'} · 3-VIEW SHEET
          </text>
        </svg>
      </div>
    );
  }

  // 2. Scene Environment Spatial Anchor
  if (nodeType === 'scene_asset') {
    const primary = data.colorPalette?.[1] || '#F59E0B';
    return (
      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-[#09090B] border border-zinc-800 select-none">
        <svg viewBox="0 0 360 130" className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="scene-lamp" cx="0.5" cy="0.45" r="0.55">
              <stop offset="0%" stopColor={primary} stopOpacity="0.45" />
              <stop offset="60%" stopColor="#18181B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#09090B" stopOpacity="1" />
            </radialGradient>
          </defs>
          <rect width="360" height="130" fill="#09090B" />
          <rect width="360" height="130" fill="url(#scene-lamp)" />

          {/* 1-Point Perspective Architectural Lines */}
          <line x1="0" y1="0" x2="180" y2="62" stroke="#27272A" strokeWidth="0.7" />
          <line x1="360" y1="0" x2="180" y2="62" stroke="#27272A" strokeWidth="0.7" />
          <line x1="0" y1="130" x2="180" y2="62" stroke="#27272A" strokeWidth="0.7" />
          <line x1="360" y1="130" x2="180" y2="62" stroke="#27272A" strokeWidth="0.7" />

          {/* Memory Vial Shelves Left & Right */}
          {[28, 52, 76].map((x, idx) => (
            <g key={`shelf-l-${idx}`}>
              <rect x={x} y={22 + idx * 6} width="14" height={75 - idx * 12} fill="#18181B" stroke="#3F3F46" strokeWidth="0.7" />
              <circle cx={x + 7} cy={40 + idx * 5} r="2.5" fill={primary} />
              <circle cx={x + 7} cy={58 + idx * 4} r="2.5" fill="#38BDF8" />
            </g>
          ))}
          {[318, 294, 270].map((x, idx) => (
            <g key={`shelf-r-${idx}`}>
              <rect x={x} y={22 + idx * 6} width="14" height={75 - idx * 12} fill="#18181B" stroke="#3F3F46" strokeWidth="0.7" />
              <circle cx={x + 7} cy={42 + idx * 5} r="2.5" fill={primary} />
              <circle cx={x + 7} cy={60 + idx * 4} r="2.5" fill={primary} />
            </g>
          ))}

          {/* Foreground Mahogany Counter & Brass Lamp */}
          <rect x="85" y="86" width="190" height="32" fill="#18181B" stroke={primary} strokeWidth="0.9" />
          <path d="M168,66 L192,66 L186,54 L174,54 Z" fill={primary} />
          <line x1="180" y1="66" x2="180" y2="86" stroke={primary} strokeWidth="2" />

          <text x="14" y="18" fill="#E4E4E7" fontSize="8" fontFamily="JetBrains Mono">
            SPATIAL LOCK · 3200K AMBER / 6500K RAIN
          </text>
        </svg>
      </div>
    );
  }

  // 3. Storyboard Visual Frame (Supports 9:16 Vertical & 16:9 Horizontal + AI Custom SVG Elements)
  const isVertical = (data.aspectRatio || '9:16') === '9:16';
  const primaryHue = data.customSvgElements?.primaryHue || '#F59E0B';
  const secondaryHue = data.customSvgElements?.secondaryHue || '#18181B';
  const silhouette = data.customSvgElements?.silhouetteType || 'single_closeup';
  const vectorLabel =
    data.customSvgElements?.cameraVectorLabel || `${data.cameraMove || 'PUSH IN'} · ${data.focalLength || '35mm'}`;

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-44' : isVertical ? 'h-64' : 'h-40'
      } rounded-lg overflow-hidden bg-[#09090B] border border-zinc-800 select-none group`}
    >
      {data.generatedImageUrl ? (
        <img
          src={data.generatedImageUrl}
          alt={data.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 300 400"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`sb-bg-${data.shotNumber || data.title}`} x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#09090B" />
              <stop offset="55%" stopColor={secondaryHue} />
              <stop offset="100%" stopColor="#09090B" />
            </linearGradient>
            <radialGradient id={`sb-key-${data.shotNumber || data.title}`} cx="0.5" cy="0.42" r="0.52">
              <stop offset="0%" stopColor={primaryHue} stopOpacity="0.52" />
              <stop offset="60%" stopColor={primaryHue} stopOpacity="0.12" />
              <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Base Atmosphere */}
          <rect width="300" height="400" fill={`url(#sb-bg-${data.shotNumber || data.title})`} />
          <circle cx="150" cy="175" r="155" fill={`url(#sb-key-${data.shotNumber || data.title})`} />

          {/* Atmospheric Rain / Light Streaks */}
          <g stroke="#A1A1AA" strokeOpacity="0.18" strokeWidth="1">
            <line x1="45" y1="20" x2="25" y2="110" />
            <line x1="95" y1="50" x2="75" y2="150" />
            <line x1="235" y1="30" x2="215" y2="130" />
            <line x1="270" y1="90" x2="250" y2="190" />
            <line x1="60" y1="220" x2="40" y2="310" />
          </g>

          {/* Composition Variant 1: Single Close-Up + Glowing Memory Vial */}
          {silhouette === 'single_closeup' && (
            <g>
              <path d="M15,95 Q150,35 285,95" fill="none" stroke="#52525B" strokeWidth="1.5" />
              <path
                d="M75,355 L92,205 Q150,185 208,205 L225,355 Z"
                fill="#18181B"
                stroke={primaryHue}
                strokeWidth="1.5"
              />
              <ellipse cx="150" cy="145" rx="34" ry="42" fill="#E4E4E7" />
              <path d="M114,138 Q150,92 186,138 L190,192 L176,188 L174,148 L126,148 L124,188 L110,192 Z" fill="#09090B" />
              <g transform="translate(150, 255)">
                <circle cx="0" cy="0" r="36" fill={primaryHue} fillOpacity="0.22" />
                <rect x="-14" y="-24" width="28" height="48" rx="6" fill="#09090B" stroke="#FBBF24" strokeWidth="2" />
                <path d="M-8,-10 L4,2 L-4,12 L8,20" fill="none" stroke="#FBBF24" strokeWidth="1.8" />
                <circle cx="0" cy="-2" r="5" fill="#FBBF24" />
              </g>
            </g>
          )}

          {/* Composition Variant 2: Over-the-Shoulder (OTS) Counter Confrontation */}
          {silhouette === 'two_person_ots' && (
            <g>
              <ellipse cx="52" cy="215" rx="46" ry="56" fill="#09090B" fillOpacity="0.88" />
              <path d="M-10,390 L8,265 Q65,255 112,285 L128,390 Z" fill="#09090B" fillOpacity="0.92" />
              <path
                d="M135,340 L148,195 Q195,180 242,195 L258,340 Z"
                fill="#18181B"
                stroke={primaryHue}
                strokeWidth="1.5"
              />
              <ellipse cx="195" cy="140" rx="28" ry="35" fill="#D4D4D8" />
              <line x1="160" y1="220" x2="160" y2="268" stroke="#E4E4E7" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="160" cy="278" r="14" fill="#09090B" stroke="#E4E4E7" strokeWidth="2" />
              <circle cx="160" cy="278" r="4" fill={primaryHue} />
            </g>
          )}

          {/* Composition Variant 3: Extreme Close-Up (ECU) Eyes + Swirling Memory Threads */}
          {silhouette === 'dramatic_eyes' && (
            <g>
              <rect x="0" y="95" width="300" height="175" fill="#09090B" stroke={primaryHue} strokeWidth="1" />
              <path d="M42,182 Q85,152 128,182 Q85,206 42,182 Z" fill="#E4E4E7" />
              <circle cx="86" cy="181" r="16" fill="#09090B" />
              <circle cx="86" cy="181" r="7" fill={primaryHue} />
              <circle cx="91" cy="176" r="3" fill="#FFFFFF" />

              <path d="M172,182 Q215,152 258,182 Q215,206 172,182 Z" fill="#E4E4E7" />
              <circle cx="214" cy="181" r="16" fill="#09090B" />
              <circle cx="214" cy="181" r="7" fill={primaryHue} />
              <circle cx="219" cy="176" r="3" fill="#FFFFFF" />

              <path
                d="M20,235 Q150,120 280,225"
                fill="none"
                stroke={primaryHue}
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M35,130 Q150,240 265,135"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* Composition Variant 4: Action Dynamic / Wide Environment */}
          {(silhouette === 'action_dynamic' || silhouette === 'wide_environment') && (
            <g>
              <polygon points="150,65 45,330 255,330" fill={primaryHue} fillOpacity="0.16" />
              <circle cx="150" cy="195" r="48" fill="none" stroke={primaryHue} strokeWidth="2" />
              <path d="M90,260 Q150,140 215,245" fill="none" stroke="#F4F4F5" strokeWidth="3" />
              <circle cx="150" cy="195" r="12" fill={primaryHue} />
            </g>
          )}

          {/* Cinematographer Viewfinder Frame & Rule-of-Thirds Reticle */}
          <rect
            x="18"
            y="18"
            width="264"
            height="364"
            fill="none"
            stroke="#F4F4F5"
            strokeOpacity="0.22"
            strokeWidth="1"
          />
          <path d="M18,36 L18,18 L36,18" fill="none" stroke={primaryHue} strokeWidth="2" />
          <path d="M264,18 L282,18 L282,36" fill="none" stroke={primaryHue} strokeWidth="2" />
          <path d="M18,364 L18,382 L36,382" fill="none" stroke={primaryHue} strokeWidth="2" />
          <path d="M264,382 L282,382 L282,364" fill="none" stroke={primaryHue} strokeWidth="2" />

          <line x1="144" y1="195" x2="156" y2="195" stroke="#F4F4F5" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="150" y1="189" x2="150" y2="201" stroke="#F4F4F5" strokeOpacity="0.4" strokeWidth="1" />

          <text x="28" y="36" fill="#F4F4F5" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
            {data.shotNumber || 'SHOT'} · {data.aspectRatio || '9:16'}
          </text>
          <text x="28" y="52" fill={primaryHue} fontSize="9.5" fontFamily="JetBrains Mono">
            {vectorLabel}
          </text>
        </svg>
      )}

      {/* Measured Bottom Scrim with Subtitle & Anchor Inheritance Count */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-3 pt-8 flex flex-col gap-1">
        {data.dialogueSnippet && (
          <p className="text-[11px] leading-snug text-zinc-100 font-medium line-clamp-2 drop-shadow">
            {data.speakerName ? `${data.speakerName}：` : ''}
            {data.dialogueSnippet}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono tabular-nums">
          <span>
            {data.shotSize || '特写 CU'} · {data.durationSec ?? 3.0}s
          </span>
          <span>
            {upstreamAnchorCount > 0 ? `已继承 ${upstreamAnchorCount} 个锚点` : '独立分镜'}
          </span>
        </div>
      </div>
    </div>
  );
};
