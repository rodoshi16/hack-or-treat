import { useState, useEffect, useRef } from "react";

interface FlashlightEffectProps {
  brightness?: "dark" | "medium" | "bright";
}

const FlashlightEffect = ({ brightness = "dark" }: FlashlightEffectProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [flicker, setFlicker] = useState(0);
  const [lightning, setLightning] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Subtle flashlight flicker and occasional lightning
  useEffect(() => {
    let mounted = true;
    const startTime = performance.now();

    const loop = (now: number) => {
      if (!mounted) return;
      const t = (now - startTime) / 1000;
      const value = Math.sin(t * 2.1) * 0.6 + Math.sin(t * 3.7) * 0.4;
      setFlicker(value);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    let timeoutId: number | undefined;
    const scheduleLightning = () => {
      const delay = 4000 + Math.random() * 5000;
      timeoutId = window.setTimeout(() => {
        setLightning(true);
        window.setTimeout(() => setLightning(false), 500);
        scheduleLightning();
      }, delay);
    };
    scheduleLightning();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
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
    // Slightly stronger glow (~42%) to make the beam more noticeable
    return "0.42";
  };

  const getGlowSecondaryOpacity = () => {
    // Outer halo (~24%) for clearer falloff
    return "0.24";
  };

  const overlayOpacity = getOverlayOpacity();
  const glowOpacity = getGlowOpacity();
  const glowSecondaryOpacity = getGlowSecondaryOpacity();
  const flickerRadius = 180 + flicker * 16;

  return (
    <>
      {/* Fog layers */}
      <div
        className="pointer-events-none fixed inset-0 z-5"
        style={{
          background:
            "radial-gradient(800px 400px at 20% 10%, rgba(255,255,255,0.04), transparent 60%)," +
            "radial-gradient(600px 300px at 80% 40%, rgba(255,255,255,0.035), transparent 60%)",
          filter: "blur(36px)",
          opacity: 0.85,
          animation: "fog-move-1 18s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(700px 350px at 70% 75%, rgba(255,255,255,0.03), transparent 60%)," +
            "radial-gradient(900px 450px at 10% 60%, rgba(255,255,255,0.04), transparent 60%)",
          filter: "blur(44px)",
          opacity: 0.75,
          animation: "fog-move-2 24s ease-in-out infinite",
        }}
      />

      {/* Film grain */}
      <div
        className="pointer-events-none fixed inset-0 z-15"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 2px)," +
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 2px)",
          mixBlendMode: "overlay",
          animation: "grain 2.2s steps(8) infinite",
        }}
      />
      {/* Dark overlay that obscures content */}
      <div 
        className={`pointer-events-none fixed inset-0 z-30 ${overlayOpacity}`}
        style={{
          maskImage: `radial-gradient(circle ${flickerRadius}px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle ${flickerRadius}px at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, black 100%)`,
          transition: 'none',
        }}
      />

      {/* Enhanced cursor flashlight effect */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          background: `radial-gradient(circle ${flickerRadius - 20}px at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--glow-primary) / ${glowOpacity}) 0%, hsl(var(--glow-secondary) / ${glowSecondaryOpacity}) 40%, transparent 70%)`,
          transition: 'none',
        }}
      />

      {lightning && (
        <div
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
            mixBlendMode: "screen",
            animation: "lightning-flash 0.5s ease-out 1",
          }}
        />
      )}
    </>
  );
};

export default FlashlightEffect;


