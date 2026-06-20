"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Route } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";

import MedicineSearchBar from "./components/search-bar";
import PharmacyCard from "./components/pharmacy-card";
import PharmacyMap from "./components/pharmacy-map";
import "./medicines.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MedicinesSearchPage() {
  const [activeSearch, setActiveSearch] = useState("");
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activePharmacy, setActivePharmacy] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration }

  const mapInstanceRef = useRef(null);
  const heroRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Convex queries
  const allPharmacies = useQuery(api.medicines.getAllPharmacies);
  const searchResults = useQuery(api.medicines.searchMedicines, {
    searchQuery: activeSearch,
    patientLat: location?.lat,
    patientLng: location?.lng,
  });

  // GSAP hero entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero-badge", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo(".hero-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
        .fromTo(".hero-subtitle", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .fromTo(".search-container", { opacity: 0, y: 30, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, "-=0.2")
        .fromTo(".map-container", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8 }, "-=0.3");
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // GSAP stagger animation for results
  useEffect(() => {
    if (!searchResults || searchResults.length === 0) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".result-card",
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }, resultsRef);

    return () => ctx.revert();
  }, [searchResults]);

  const handleSearch = (query) => {
    setActiveSearch(query);
    setRouteData(null);
    setRouteInfo(null);
    setActivePharmacy(null);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
        toast.success("Location detected successfully");
      },
      () => {
        setIsLocating(false);
        toast.error("Unable to retrieve your location");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const handleShowOnMap = (result) => {
    setActivePharmacy(result);
    setRouteData(null);
    setRouteInfo(null);
  };

  const handleNavigate = async (result) => {
    if (!location) {
      toast.error("Please enable your location first");
      return;
    }
    if (!result.shopLat || !result.shopLng) {
      toast.error("Pharmacy location not available");
      return;
    }

    toast.loading("Calculating route...", { id: "route" });

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${location.lng},${location.lat};${result.shopLng},${result.shopLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        toast.error("No route found", { id: "route" });
        return;
      }

      const route = data.routes[0];
      setRouteData({ geometry: route.geometry });
      setRouteInfo({
        distance: (route.distance / 1000).toFixed(1), // km
        duration: Math.round(route.duration / 60), // minutes
      });
      setActivePharmacy(result);
      toast.success(`Route found: ${(route.distance / 1000).toFixed(1)} km, ~${Math.round(route.duration / 60)} min`, { id: "route" });
    } catch (error) {
      console.error("Directions error:", error);
      toast.error("Failed to calculate route", { id: "route" });
    }
  };

  return (
    <div ref={heroRef} className="min-h-screen">
      {/* Hero Section */}
      <div className="container max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-10">
          <Badge
            variant="outline"
            className="hero-badge bg-emerald-900/30 border-emerald-700/30 px-4 py-1.5 text-emerald-400 text-sm font-medium mb-5"
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5 inline" />
            Real-Time Pharmacy Locator
          </Badge>
          <h1 className="hero-title text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight">
            Find Medicines
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Near You</span>
          </h1>
          <p className="hero-subtitle text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Search with smart shortcuts like <span className="text-emerald-400 font-medium">"p650"</span> or <span className="text-emerald-400 font-medium">"azithro"</span> — we'll find the right medicine at the closest pharmacies.
          </p>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="search-container max-w-4xl mx-auto mb-10">
          <MedicineSearchBar
            onSearch={handleSearch}
            onLocationRequest={requestLocation}
            location={location}
            isLocating={isLocating}
          />
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="max-w-4xl mx-auto mb-6 flex justify-center">
            <div className="route-active-badge">
              <Route className="h-4 w-4" />
              <span>Route: <strong>{routeInfo.distance} km</strong> · ~<strong>{routeInfo.duration} min</strong> drive</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content — Split Layout */}
      <div className="container max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Results Panel (Left) */}
          <div ref={resultsRef} className="lg:col-span-2 space-y-4 order-2 lg:order-1 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {activeSearch && searchResults === undefined && (
              <div className="text-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Searching pharmacies...</p>
              </div>
            )}

            {activeSearch && searchResults !== undefined && searchResults.length === 0 && (
              <div className="text-center py-16 glass-panel">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  No pharmacies have "{activeSearch}" in stock. Try a different search.
                </p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {searchResults.length} {searchResults.length === 1 ? "pharmacy" : "pharmacies"} found
                  </h3>
                </div>
                {searchResults.map((result) => (
                  <div key={result.medicineId} className="result-card">
                    <PharmacyCard
                      result={result}
                      onShowOnMap={handleShowOnMap}
                      onNavigate={handleNavigate}
                      userLocation={location}
                    />
                  </div>
                ))}
              </>
            )}

            {!activeSearch && (
              <div className="text-center py-16 glass-panel">
                <div className="text-5xl mb-4">💊</div>
                <h3 className="text-xl font-medium text-white mb-2">Search for a medicine</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Type a medicine name or shortcut in the search bar above. Enable your location for distance-sorted results.
                </p>
              </div>
            )}
          </div>

          {/* Map Panel (Right) */}
          <div className="lg:col-span-3 order-1 lg:order-2 map-container">
            <div className="glass-panel p-1.5 h-[500px] lg:h-[700px]">
              <PharmacyMap
                pharmacies={allPharmacies || []}
                searchResults={searchResults}
                userLocation={location}
                activePharmacy={activePharmacy}
                routeData={routeData}
                mapRef={mapInstanceRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
