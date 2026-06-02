interface Props { width?: string; height?: string; className?: string }

export function Skel({ width = '100%', height = '20px', className = '' }: Props) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function CardSkel() {
  return (
    <div className="card">
      <Skel width="60%" height="10px" />
      <Skel width="40%" height="28px" className="mt-3" />
      <Skel width="50%" height="10px" className="mt-2" />
    </div>
  );
}

export function ChartSkel({ height = '260px' }: { height?: string }) {
  return <div className="skeleton" style={{ width: '100%', height, borderRadius: 2 }} />;
}
