/**
 * Subtle wave SVG decoration for the bottom of the dashboard hero area.
 * Light mode uses slightly brighter waves; dark mode uses very subtle ones.
 */
export default function WaveDecoration() {
  return (
    <div className="w-full overflow-hidden pointer-events-none" style={{ height: 40, marginTop: -8 }}>
      <svg
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back wave — light mode 0.08, dark mode 0.04 */}
        <path
          d="M0,80 Q100,40 200,80 T400,80 V160 H0 Z"
          className="wave-back"
          style={{ fill: 'rgba(255,255,255,0.08)' }}
        />
        {/* Front wave — light mode 0.05, dark mode 0.02 */}
        <path
          d="M0,100 Q100,60 200,100 T400,100 V160 H0 Z"
          style={{ fill: 'rgba(255,255,255,0.05)' }}
        />
      </svg>
    </div>
  );
}
