import React from "react";
/** copied from maanas portfolio */
const WaveformVisualization = ({ waveform = [], isActive }) => {
  const activeColor = "#fbbf24"; 
  const inactiveColor = "rgba(255, 255, 255, 0.05)";

  return (
    <div 
      className="flex items-center justify-between" 
      style={{ 
        height: "60px",
        width: "100%",
        padding: "0 6px",
        marginTop: "2px",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)"
      }}
    >
      {waveform.map((value, index) => {
        const minHeight = 6; 
        const heightPercent = value * 100;

        return (
          <div
            key={index}
            style={{
              width: "1.8%",
              height: isActive ? `calc(${heightPercent}% + ${minHeight}px)` : `${minHeight}px`,
              backgroundColor: isActive ? activeColor : inactiveColor,
              borderRadius: "100px",
              transition: "height 0.1s ease-out",
              transformOrigin: "center",
              opacity: isActive ? 0.2 + (value * 0.8) : 0.15,
            }}
          />
        );
      })}
    </div>
  );
};

export default WaveformVisualization;