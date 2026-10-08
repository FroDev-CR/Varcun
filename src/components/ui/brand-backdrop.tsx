import { WarpGradient } from '@/components/ui/warp-gradient';

const BRAND_COLORS = ['#04162a', '#093c5b', '#168d99'];

/** Shared Varcun background; the page's motion control pauses every instance. */
export function BrandBackdrop({ paused, className }: { paused: boolean; className?: string }) {
  return <>
    <WarpGradient className={className} colors={BRAND_COLORS} preset="tide" grain={0.16} speed={0.65} scale={0.5} paused={paused} />
    <div className="brand-gradient-shade" aria-hidden="true" />
  </>;
}
