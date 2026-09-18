const AVATAR_PALETTE = [
  "#0c5b9a",
  "#166534",
  "#92400e",
  "#7e22ce",
  "#0f766e",
  "#b42318",
  "#334155",
  "#a16207",
];

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function colorFor(fullName: string) {
  let hash = 0;

  for (let i = 0; i < fullName.length; i += 1) {
    hash = (hash * 31 + fullName.charCodeAt(i)) >>> 0;
  }

  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function StudentIdentity({
  fullName,
  subtitle,
  size = "md",
}: {
  fullName: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={`student-identity student-identity--${size}`}>
      <span
        className="student-identity__avatar"
        style={{ background: colorFor(fullName) }}
      >
        {initialsFor(fullName)}
      </span>
      <div className="student-identity__text">
        <strong>{fullName}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </div>
  );
}
