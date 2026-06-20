"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export function Globe({ className }) {
  const mapContainer = useRef(null);

  useEffect(() => {
    // Check if token exists
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token is missing!");
      return;
    }
    
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: "globe", 
      zoom: 1.2,
      center: [77.209, 20.6139], // Center over India initially
      interactive: true,
      attributionControl: false, // hide attribution for cleaner look
    });

    let animationId = null;

    map.on("style.load", () => {
      // Set atmospheric glow
      map.setFog({
        color: "rgba(16, 185, 129, 0.2)", // Emerald lower atmosphere
        "high-color": "#050505", // Dark upper atmosphere
        "horizon-blend": 0.05,
        "space-color": "#000000",
        "star-intensity": 0.5,
      });

      let isUserInteracting = false;
      let spinEnabled = true;
      const secondsPerRevolution = 120;
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;

      map.on('mousedown', () => { isUserInteracting = true; });
      map.on('mouseup', () => { isUserInteracting = false; });
      map.on('dragstart', () => { isUserInteracting = true; });
      map.on('dragend', () => { isUserInteracting = false; });
      map.on('pitchend', () => { isUserInteracting = false; });
      map.on('rotateend', () => { isUserInteracting = false; });

      map.on('moveend', () => {
          spinGlobe();
      });

      function spinGlobe() {
        const zoom = map.getZoom();
        if (spinEnabled && !isUserInteracting && zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
                const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
                distancePerSecond *= zoomDif;
            }
            const center = map.getCenter();
            center.lng -= distancePerSecond;
            
            map.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }
      
      spinGlobe();
    });

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      map.remove();
    };
  }, []);

  return (
    <div className={`relative w-[120%] h-[120%] flex items-center justify-center ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full cursor-grab active:cursor-grabbing rounded-full shadow-[0_0_100px_rgba(16,185,129,0.15)] mix-blend-screen" 
        style={{ contain: "layout paint size" }}
      />
    </div>
  );
}
