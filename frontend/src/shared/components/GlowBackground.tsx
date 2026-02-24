/**
 * GlowBackground Component
 * 
 * Animated background with glowing effects for portal/login pages.
 * This is a shared component that creates the distinctive visual effect.
 */
export function GlowBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-black">
      {/* Animated Glows */}
      {/* Top Glow: H1 Blue */}
      <div className="absolute -top-48 left-0 right-0 mx-auto w-[1000px] h-[600px] bg-h1-blue/10 rounded-full blur-[120px] animate-float-tl-br" />
      
      {/* Bottom Glow: H1 Pink */}
      <div className="absolute -bottom-48 left-0 right-0 mx-auto w-[1000px] h-[600px] bg-h1-pink/5 rounded-full blur-[120px] animate-float-br-tl" />
      
      {/* Radial Dots on top of glows */}
      <div className="absolute inset-0 bg-dots opacity-30" />
    </div>
  );
}
