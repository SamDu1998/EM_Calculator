/**
 * Static-SVG grain overlay. Re-renders only when the device pixel ratio
 * changes — feTurbulence is cheap once but pricey to re-rasterise per frame,
 * so the layer is kept inert and stretched via CSS.
 */
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
    <feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)' opacity='0.5'/>
</svg>`

const NOISE_DATA_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`

export function GrainOverlay(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="grain"
      style={{ backgroundImage: NOISE_DATA_URL }}
    />
  )
}
