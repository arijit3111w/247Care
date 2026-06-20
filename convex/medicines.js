import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// -------------------------------------------------------------
// CHEMIST MUTATIONS AND QUERIES
// -------------------------------------------------------------

export const getInventory = query({
  args: { pharmacyId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // If pharmacyId is not passed, use current user
    let pharmacyId = args.pharmacyId;
    if (!pharmacyId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthenticated");
      
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
        .unique();
        
      if (!user) throw new Error("User not found");
      if (user.role !== "CHEMIST") throw new Error("Unauthorized");
      
      pharmacyId = user._id;
    }

    const medicines = await ctx.db
      .query("medicines")
      .withIndex("by_pharmacyId", (q) => q.eq("pharmacyId", pharmacyId))
      .collect();

    return medicines;
  },
});

export const addMedicine = mutation({
  args: {
    medicineName: v.string(),
    quantity: v.number(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
      
    if (!user) throw new Error("User not found");
    if (user.role !== "CHEMIST") throw new Error("Unauthorized");
    
    // Check if medicine already exists for this pharmacy
    const existing = await ctx.db
      .query("medicines")
      .withIndex("by_pharmacyId", (q) => q.eq("pharmacyId", user._id))
      .filter((q) => q.eq(q.field("medicineName"), args.medicineName))
      .unique();
      
    if (existing) {
      // Just update quantity and price if it exists
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
        price: args.price,
        updatedAt: new Date().toISOString()
      });
      return existing._id;
    }

    const medicineId = await ctx.db.insert("medicines", {
      pharmacyId: user._id,
      medicineName: args.medicineName,
      quantity: args.quantity,
      price: args.price,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return medicineId;
  },
});

export const updateMedicine = mutation({
  args: {
    medicineId: v.id("medicines"),
    medicineName: v.optional(v.string()),
    quantity: v.optional(v.number()),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
      
    if (!user || user.role !== "CHEMIST") throw new Error("Unauthorized");
    
    const medicine = await ctx.db.get(args.medicineId);
    if (!medicine) throw new Error("Medicine not found");
    if (medicine.pharmacyId !== user._id) throw new Error("Unauthorized");

    const patchData = { updatedAt: new Date().toISOString() };
    if (args.medicineName !== undefined) patchData.medicineName = args.medicineName;
    if (args.quantity !== undefined) patchData.quantity = args.quantity;
    if (args.price !== undefined) patchData.price = args.price;

    await ctx.db.patch(args.medicineId, patchData);
    return true;
  },
});

export const deleteMedicine = mutation({
  args: {
    medicineId: v.id("medicines"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
      
    if (!user || user.role !== "CHEMIST") throw new Error("Unauthorized");
    
    const medicine = await ctx.db.get(args.medicineId);
    if (!medicine) throw new Error("Medicine not found");
    if (medicine.pharmacyId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.medicineId);
    return true;
  },
});

// -------------------------------------------------------------
// SMART MEDICINE ALIASES (Fuzzy AI-like Search)
// Maps common shorthand/slang to canonical medicine keywords.
// When a user types "p650", we expand it to search for "paracetamol".
// -------------------------------------------------------------
const MEDICINE_ALIASES = {
  "p650": "paracetamol",
  "p500": "paracetamol",
  "pcm": "paracetamol",
  "para": "paracetamol",
  "dolo": "dolo",
  "crocin": "crocin",
  "azithro": "azithromycin",
  "amox": "amoxicillin",
  "amoxyclav": "amoxicillin clavulanate",
  "aug": "augmentin",
  "metro": "metronidazole",
  "metfor": "metformin",
  "cetriz": "cetirizine",
  "cetiriz": "cetirizine",
  "montel": "montelukast",
  "panto": "pantoprazole",
  "omez": "omeprazole",
  "ome": "omeprazole",
  "rani": "ranitidine",
  "diclo": "diclofenac",
  "ibup": "ibuprofen",
  "brufen": "ibuprofen",
  "aspirin": "aspirin",
  "disp": "disprin",
  "cef": "cefixime",
  "cipro": "ciprofloxacin",
  "levo": "levofloxacin",
  "oflox": "ofloxacin",
  "norflox": "norfloxacin",
  "clav": "clavulanate",
  "alben": "albendazole",
  "zinc": "zinc",
  "ors": "ors",
  "bcomplex": "b complex",
  "multiv": "multivitamin",
  "vita": "vitamin",
  "calc": "calcium",
  "iron": "iron",
  "folic": "folic acid",
  "shelcal": "shelcal",
  "atenol": "atenolol",
  "amlod": "amlodipine",
  "losart": "losartan",
  "telmi": "telmisartan",
};

function expandQuery(rawQuery) {
  const lower = rawQuery.toLowerCase().trim();
  // Check exact alias match first
  if (MEDICINE_ALIASES[lower]) {
    return MEDICINE_ALIASES[lower];
  }
  // Check if any alias starts with the query
  for (const [alias, canonical] of Object.entries(MEDICINE_ALIASES)) {
    if (alias.startsWith(lower) || lower.startsWith(alias)) {
      return canonical;
    }
  }
  return lower; // No match, use the raw query
}

// -------------------------------------------------------------
// PATIENT SEARCH QUERY
// -------------------------------------------------------------

export const searchMedicines = query({
  args: {
    searchQuery: v.string(),
    patientLat: v.optional(v.number()),
    patientLng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery || args.searchQuery.length < 2) {
      return [];
    }

    // Smart expand the query using aliases
    const expandedQuery = expandQuery(args.searchQuery);

    // 1. Find all medicines matching the query
    const allMedicines = await ctx.db
      .query("medicines")
      .filter((q) => q.gt(q.field("quantity"), 0)) // Only in-stock
      .collect();

    const matchingMedicines = allMedicines.filter((m) => 
      m.medicineName.toLowerCase().includes(expandedQuery)
    );

    if (matchingMedicines.length === 0) return [];

    // 2. Fetch the pharmacy details for each match
    const results = await Promise.all(
      matchingMedicines.map(async (medicine) => {
        const pharmacy = await ctx.db.get(medicine.pharmacyId);
        
        let distance = null;
        if (args.patientLat && args.patientLng && pharmacy.shopLat && pharmacy.shopLng) {
          distance = calculateDistance(
            args.patientLat,
            args.patientLng,
            pharmacy.shopLat,
            pharmacy.shopLng
          );
        }

        return {
          medicineId: medicine._id,
          medicineName: medicine.medicineName,
          quantity: medicine.quantity,
          price: medicine.price,
          pharmacyId: pharmacy._id,
          shopName: pharmacy.shopName || pharmacy.name,
          shopAddress: pharmacy.shopAddress,
          shopLat: pharmacy.shopLat || null,
          shopLng: pharmacy.shopLng || null,
          distance: distance, // in km
        };
      })
    );

    // 3. Sort by distance (if available) or by price
    results.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance; // Closest first
      }
      return a.price - b.price; // Cheapest first if no distance
    });

    return results;
  },
});

// -------------------------------------------------------------
// GET ALL VERIFIED PHARMACIES (for map markers)
// -------------------------------------------------------------

export const getAllPharmacies = query({
  args: {},
  handler: async (ctx) => {
    const chemists = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("role"), "CHEMIST"),
          q.eq(q.field("verificationStatus"), "VERIFIED")
        )
      )
      .collect();

    return chemists
      .filter((c) => c.shopLat && c.shopLng)
      .map((c) => ({
        id: c._id,
        shopName: c.shopName || c.name,
        shopAddress: c.shopAddress,
        shopLat: c.shopLat,
        shopLng: c.shopLng,
      }));
  },
});
