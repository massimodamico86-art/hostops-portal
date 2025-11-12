import { useEffect, useRef, useState } from "react";

/**
 * Renders a fixed design (default 1920x1080) and scales it
 * to the size of its parent or to the screen.
 *
 * Props:
 * - baseWidth, baseHeight: design size
 * - fullScreen: if true, fills the screen; otherwise fills parent
 * - className: classes for the outer box
 */
export default function ScaledStage({
  baseWidth = 1920,
  baseHeight = 1080,
  fullScreen = true,
  className = "",
  children,
}) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      const s = Math.min(width / baseWidth, height / baseHeight);
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth, baseHeight]);

  const outerClasses = fullScreen
    ? "w-screen h-screen overflow-hidden grid place-items-center"
    : "w-full h-full overflow-hidden grid place-items-center";

  return (
    <div ref={boxRef} className={`${outerClasses} ${className}`}>
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="relative bg-black"
      >
        {children}
      </div>
    </div>
  );
}