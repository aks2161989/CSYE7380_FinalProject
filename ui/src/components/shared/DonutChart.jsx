export default function DonutChart({ segments, centerLabel, centerSub }) {
  const r = 58;
  const cx = 72;
  const cy = 72;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const gap = segments.length > 1 ? circumference * (1.8 / 360) : 0;

  let accumulated = 0;
  return (
    <svg width="144" height="144" viewBox="0 0 144 144" className="overflow-visible">
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="22"
        className="dark:[stroke:#1e293b]" />
      {segments.map((seg, i) => {
        const dash = Math.max(0, (seg.value / total) * circumference - gap);
        const rotate = (accumulated / total) * 360 - 90;
        accumulated += seg.value;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="22"
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(${rotate}, ${cx}, ${cy})`}
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.15))" }}
          />
        );
      })}
      {/* center label */}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="currentColor"
        fontSize="20" fontWeight="700">{centerLabel}</text>
      <text x={cx} y={cx + 11} textAnchor="middle" fill="#94a3b8"
        fontSize="9" fontWeight="500" letterSpacing="0.08em">{centerSub}</text>
    </svg>
  );
}
