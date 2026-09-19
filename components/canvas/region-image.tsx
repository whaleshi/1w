import { useId } from "react";
import { regionPoints, type Region } from "@/lib/grid";
export function RegionImage({
  image,
  region,
  label,
}: {
  image: string;
  region: Region;
  label: string;
}) {
  const clip = useId();
  return (
    <svg
      viewBox={`0 0 ${region.width * 100} ${region.height * 100}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clip}>
          {regionPoints(region).map((p) => (
            <rect
              key={`${p.x}:${p.y}`}
              x={(p.x - region.x) * 100}
              y={(p.y - region.y) * 100}
              width="100"
              height="100"
            />
          ))}
        </clipPath>
      </defs>
      <image
        href={image}
        width={region.width * 100}
        height={region.height * 100}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}
