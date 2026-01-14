import { ASSET_PATHS } from '../utils/paths';

interface StarsProps {
  stars: number;
  className?: string;
}

export function Stars({ stars, className = '' }: StarsProps) {
  const s = Number(stars) || 0;
  return (
    <div className={`caption__stars ${className}`.trim()}>
      {[1, 2, 3].map((i) => (
        <img
          key={i}
          src={ASSET_PATHS.starPng}
          alt={i <= s ? 'Star on' : 'Star off'}
          className={i <= s ? 'on' : 'off'}
        />
      ))}
    </div>
  );
}
