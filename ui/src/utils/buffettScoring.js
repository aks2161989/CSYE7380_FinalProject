export const SCORE_HEX = { strong: "#10b981", mixed: "#f59e0b", weak: "#ef4444", none: "#94a3b8" };

export function scoreHex(passRate) {
  if (passRate >= 0.7) return SCORE_HEX.strong;
  if (passRate >= 0.4) return SCORE_HEX.mixed;
  return SCORE_HEX.weak;
}

export function getScoreStyle(passRate) {
  if (passRate >= 0.7)
    return {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      label: "Strong",
    };
  if (passRate >= 0.4)
    return {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      label: "Mixed",
    };
  return {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    label: "Weak",
  };
}
