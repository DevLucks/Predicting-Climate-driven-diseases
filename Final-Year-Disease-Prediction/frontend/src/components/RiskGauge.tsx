interface Props { probability: number }

export function RiskGauge({ probability }: Props) {
  const pct = Math.min(1, Math.max(0, probability));
  const isHigh = pct > 0.5;
  const color = isHigh ? '#E8453C' : '#3CCB7F';

  // Semicircle: center (100,110), radius 78, sweep from left to right through top
  const r = 78;
  const cx = 100, cy = 110;
  const arcLen = Math.PI * r; // 245.04

  // Needle angle: pct=0 → 180° (left), pct=1 → 0° (right)
  const angleDeg = 180 - pct * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const nx = cx + 60 * Math.cos(angleRad);
  const ny = cy - 60 * Math.sin(angleRad);

  return (
    <svg width="200" height="130" viewBox="0 0 200 130" className="gauge-svg" aria-label={`Risk gauge: ${Math.round(pct * 100)}%`}>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1a3a52" strokeWidth="14" strokeLinecap="round"
      />
      {/* Colored fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${pct * arcLen} ${arcLen}`}
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
      />
      {/* Zone markers */}
      {[0.25, 0.5, 0.75].map(v => {
        const a = (180 - v * 180) * Math.PI / 180;
        const mx = cx + (r + 10) * Math.cos(a);
        const my = cy - (r + 10) * Math.sin(a);
        return <circle key={v} cx={mx} cy={my} r={2} fill="#3D6478" />;
      })}
      {/* Needle */}
      <line
        x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="white" strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: 'x2 0.6s cubic-bezier(0.4,0,0.2,1), y2 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <circle cx={cx} cy={cy} r={5} fill="white" />
      <circle cx={cx} cy={cy} r={3} fill={color} />
      {/* Labels */}
      <text x={cx} y={cy - 22} textAnchor="middle" fill={color} fontFamily="'Syne',sans-serif" fontSize="22" fontWeight="700">
        {Math.round(pct * 100)}%
      </text>
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontFamily="'IBM Plex Mono',monospace" fontSize="9" letterSpacing="0.15em">
        {isHigh ? 'HIGH RISK' : 'LOW RISK'}
      </text>
      <text x={cx - r - 2} y={cy + 16} textAnchor="middle" fill="#3D6478" fontFamily="'IBM Plex Mono',monospace" fontSize="9">0</text>
      <text x={cx + r + 2} y={cy + 16} textAnchor="middle" fill="#3D6478" fontFamily="'IBM Plex Mono',monospace" fontSize="9">100</text>
    </svg>
  );
}
