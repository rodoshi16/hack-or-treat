import { useState, useEffect } from "react";

interface FlashlightEffectProps {
  brightness?: "dark" | "medium" | "bright";
}

const FlashlightEffect = ({ brightness = "dark" }: FlashlightEffectProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getOverlayOpacity = () => {
    switch (brightness) {
      case "bright": return "bg-black/30";
      case "medium": return "bg-black/40";
      case "dark": 
      default: return "bg-black/70";
    }
  };

  const getGlowOpacity = () => {
    // Less intense glow (~35%)
    return "0.35";
  };

  const getGlowSecondaryOpacity = () => {
    // Softer outer glow around the flashlight (~18%)
    return "0.18";
  };

  const overlayOpacity = getOverlayOpacity();
  const glowOpacity = getGlowOpacity();
  const glowSecondaryOpacity = getGlowSecondaryOpacity();

  return (
    <>
      {/* Dark overlay that obscures content */}
      <div 
        className={`pointer-events-none fixed inset-0 z-30 ${overlayOpacity}`}
        style={{
          maskImage: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 100%)`,
          transition: 'none',
        }}
      />

      {/* Enhanced cursor flashlight effect */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          background: `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--glow-primary) / ${glowOpacity}) 0%, hsl(var(--glow-secondary) / ${glowSecondaryOpacity}) 40%, transparent 70%)`,
          transition: 'none',
        }}
      />
    </>
  );
};

export default FlashlightEffect;


