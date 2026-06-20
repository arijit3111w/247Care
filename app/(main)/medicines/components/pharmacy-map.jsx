"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function PharmacyMap({
  pharmacies,
  searchResults,
  userLocation,
  activePharmacy,
  routeData,
  mapRef,        // shared ref for the mapbox instance
}) {
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const popupRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: userLocation ? [userLocation.lng, userLocation.lat] : [78.9629, 20.5937], // India center
      zoom: userLocation ? 13 : 5,
      pitch: 0,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to user location when it becomes available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, duration: 1500 });

    // Add/update user marker
    if (userMarkerRef.current) userMarkerRef.current.remove();

    const el = document.createElement("div");
    el.className = "user-marker";

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);
  }, [userLocation]);

  // Render pharmacy markers
  const renderMarkers = useCallback((items, isSearchResult = false) => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    items.forEach((item) => {
      const lat = item.shopLat;
      const lng = item.shopLng;
      if (!lat || !lng) return;

      const el = document.createElement("div");
      el.className = `pharmacy-marker${isSearchResult ? " active" : ""}`;
      el.innerHTML = `<span class="pharmacy-marker-inner">💊</span>`;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
        .setHTML(`
          <div>
            <div class="popup-shop-name">${item.shopName || "Pharmacy"}</div>
            <div class="popup-address">${item.shopAddress || ""}</div>
            ${item.medicineName ? `<div style="margin-top:8px;font-size:13px;color:#34d399;font-weight:600;">${item.medicineName} — ₹${item.price}</div>` : ""}
            ${item.quantity ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px;">${item.quantity} in stock</div>` : ""}
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, []);

  // Show all pharmacies when no search is active
  useEffect(() => {
    if (searchResults && searchResults.length > 0) return;
    if (!pharmacies || pharmacies.length === 0) return;
    renderMarkers(pharmacies, false);
  }, [pharmacies, searchResults, renderMarkers]);

  // Show search result markers
  useEffect(() => {
    if (!searchResults || searchResults.length === 0) return;
    renderMarkers(searchResults, true);

    const map = mapRef.current;
    if (!map) return;

    // Fit bounds to show all results
    if (searchResults.length === 1) {
      const r = searchResults[0];
      if (r.shopLat && r.shopLng) {
        map.flyTo({ center: [r.shopLng, r.shopLat], zoom: 14, duration: 1200 });
      }
    } else {
      const bounds = new mapboxgl.LngLatBounds();
      searchResults.forEach((r) => {
        if (r.shopLat && r.shopLng) bounds.extend([r.shopLng, r.shopLat]);
      });
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, duration: 1200, maxZoom: 14 });
      }
    }
  }, [searchResults, renderMarkers, userLocation]);

  // Fly to active pharmacy
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activePharmacy) return;

    if (activePharmacy.shopLat && activePharmacy.shopLng) {
      map.flyTo({
        center: [activePharmacy.shopLng, activePharmacy.shopLat],
        zoom: 16,
        duration: 1200,
        pitch: 45,
      });

      // Open the popup for this marker
      markersRef.current.forEach((m) => {
        const lngLat = m.getLngLat();
        if (
          Math.abs(lngLat.lat - activePharmacy.shopLat) < 0.0001 &&
          Math.abs(lngLat.lng - activePharmacy.shopLng) < 0.0001
        ) {
          m.togglePopup();
        }
      });
    }
  }, [activePharmacy]);

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing route layer/source
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getLayer("route-line-border")) map.removeLayer("route-line-border");
    if (map.getSource("route")) map.removeSource("route");

    if (!routeData) return;

    // Wait for style to load
    const addRoute = () => {
      if (map.getSource("route")) return;

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: routeData.geometry,
        },
      });

      map.addLayer({
        id: "route-line-border",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#1e40af",
          "line-width": 8,
          "line-opacity": 0.4,
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });

      // Fit to route bounds
      const coords = routeData.geometry.coordinates;
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 80, duration: 1500 });
    };

    if (map.isStyleLoaded()) {
      addRoute();
    } else {
      map.on("style.load", addRoute);
    }
  }, [routeData]);

  return (
    <div ref={containerRef} className="pharmacy-map-container" />
  );
}
