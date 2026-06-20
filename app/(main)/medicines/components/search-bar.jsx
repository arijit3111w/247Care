"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Navigation, Sparkles } from "lucide-react";

// Client-side alias map for suggestions
const MEDICINE_ALIASES = {
  "p650": "paracetamol", "p500": "paracetamol", "pcm": "paracetamol", "para": "paracetamol",
  "dolo": "dolo", "crocin": "crocin", "azithro": "azithromycin",
  "amox": "amoxicillin", "metro": "metronidazole", "metfor": "metformin",
  "cetriz": "cetirizine", "cetiriz": "cetirizine", "montel": "montelukast",
  "panto": "pantoprazole", "omez": "omeprazole", "ome": "omeprazole",
  "diclo": "diclofenac", "ibup": "ibuprofen", "brufen": "ibuprofen",
  "cef": "cefixime", "cipro": "ciprofloxacin", "levo": "levofloxacin",
  "oflox": "ofloxacin", "alben": "albendazole", "zinc": "zinc",
  "calc": "calcium", "iron": "iron", "folic": "folic acid",
  "atenol": "atenolol", "amlod": "amlodipine", "losart": "losartan",
  "telmi": "telmisartan",
};

export default function MedicineSearchBar({ onSearch, onLocationRequest, location, isLocating }) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const lower = query.toLowerCase();
    return Object.entries(MEDICINE_ALIASES)
      .filter(([alias]) => alias.startsWith(lower) || lower.startsWith(alias))
      .slice(0, 5)
      .map(([alias, canonical]) => ({ alias, canonical }));
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setShowSuggestions(false);
    onSearch(query.trim());
  };

  const handleSuggestionClick = (canonical) => {
    setQuery(canonical);
    setShowSuggestions(false);
    onSearch(canonical);
  };

  return (
    <div className="glass-panel p-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500/60" />
          <Input
            placeholder="Search medicines... try 'p650' or 'azithro'"
            className="pl-12 h-14 bg-background/50 border-emerald-900/30 text-lg rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(e.target.value.length >= 2);
            }}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {/* Smart Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestion-dropdown">
              {suggestions.map(({ alias, canonical }) => (
                <div
                  key={alias}
                  className="suggestion-item"
                  onMouseDown={() => handleSuggestionClick(canonical)}
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{canonical}</span>
                  <span className="alias-tag">{alias}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-14 px-6 border-emerald-700/30 hover:bg-emerald-900/20 rounded-xl"
          onClick={onLocationRequest}
          disabled={isLocating}
        >
          <Navigation className={`h-4 w-4 mr-2 ${isLocating ? "animate-spin" : ""}`} />
          {location ? "📍 Location Active" : "Use My Location"}
        </Button>
        <Button
          type="submit"
          className="h-14 px-10 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/20"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>
    </div>
  );
}
