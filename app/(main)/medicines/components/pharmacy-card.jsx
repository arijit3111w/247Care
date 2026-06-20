"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Store, Navigation2, Eye, ExternalLink } from "lucide-react";

export default function PharmacyCard({ result, onShowOnMap, onNavigate, userLocation }) {
  return (
    <Card className="border-emerald-900/20 bg-background/80 backdrop-blur-sm hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 group">
      <CardHeader className="pb-3 border-b border-emerald-900/10">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-emerald-50 leading-tight group-hover:text-emerald-400 transition-colors">
            {result.medicineName}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-emerald-900/20 text-emerald-400 border-emerald-800/30 whitespace-nowrap ml-2 text-base font-bold"
          >
            ₹{result.price}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Shop Info */}
        <div className="flex items-start text-sm text-muted-foreground">
          <Store className="h-4 w-4 mr-2 mt-0.5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-medium text-gray-300">{result.shopName}</p>
            <p className="line-clamp-2 mt-0.5 text-xs">{result.shopAddress}</p>
          </div>
        </div>

        {/* Stock & Distance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Package className="h-4 w-4 mr-2 text-emerald-500" />
            <span className={result.quantity < 10 ? "text-amber-400 font-semibold" : "text-gray-300"}>
              {result.quantity} in stock
            </span>
          </div>

          {result.distance !== null && (
            <div className="flex items-center text-sm text-emerald-400 font-semibold bg-emerald-900/15 px-3 py-1 rounded-full">
              <MapPin className="h-3 w-3 mr-1" />
              {result.distance.toFixed(1)} km
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {result.shopLat && result.shopLng && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[100px] border-emerald-800/30 hover:bg-emerald-900/20 hover:border-emerald-600/40 text-emerald-400"
              onClick={() => onShowOnMap(result)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View Map
            </Button>
          )}
          {result.shopLat && result.shopLng && userLocation && (
            <>
              <Button
                size="sm"
                className="flex-1 min-w-[100px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md shadow-blue-500/20"
                onClick={() => onNavigate(result)}
              >
                <Navigation2 className="h-3.5 w-3.5 mr-1.5" />
                Route
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[100px] border-blue-800/30 hover:bg-blue-900/20 hover:border-blue-600/40 text-blue-400"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${result.shopLat},${result.shopLng}`;
                  window.open(url, "_blank");
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Google Maps
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
