import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to get the current user ID based on Clerk identity
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    return user;
  },
});

/**
 * Creates the user or returns the existing user (equivalent to checkUser)
 */
export const checkUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existingUser) {
      return existingUser;
    }

    // Create a new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: identity.email || `${identity.subject}@unverified.local`,
      name: identity.name || "Unknown User",
      imageUrl: identity.pictureUrl || "",
      role: "UNASSIGNED",
      credits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create initial transaction
    await ctx.db.insert("creditTransactions", {
      userId: userId,
      amount: 0,
      type: "CREDIT_PURCHASE",
      packageId: "free_user",
      createdAt: new Date().toISOString(),
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Sets the user's role and related information (equivalent to setUserRole)
 */
export const setUserRole = mutation({
  args: {
    role: v.string(),
    specialty: v.optional(v.string()),
    experience: v.optional(v.number()),
    credentialUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    
    // Chemist-specific arguments
    licenseUrl: v.optional(v.string()),
    shopName: v.optional(v.string()),
    shopAddress: v.optional(v.string()),
    shopLat: v.optional(v.number()),
    shopLng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!["PATIENT", "DOCTOR", "CHEMIST"].includes(args.role)) {
      throw new Error("Invalid role selection");
    }

    if (args.role === "PATIENT") {
      await ctx.db.patch(user._id, {
        role: "PATIENT",
        updatedAt: new Date().toISOString(),
      });
      return { success: true, redirect: "/doctors" };
    }

    if (args.role === "DOCTOR") {
      if (!args.specialty || !args.experience || !args.credentialUrl || !args.description) {
        throw new Error("All fields are required");
      }

      await ctx.db.patch(user._id, {
        role: "DOCTOR",
        specialty: args.specialty,
        experience: args.experience,
        credentialUrl: args.credentialUrl,
        description: args.description,
        verificationStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      });

      return { success: true, redirect: "/doctor/verification" };
    }

    if (args.role === "CHEMIST") {
      if (!args.licenseUrl || !args.shopName || !args.shopAddress) {
        throw new Error("Required fields are missing for chemist registration");
      }

      await ctx.db.patch(user._id, {
        role: "CHEMIST",
        licenseUrl: args.licenseUrl,
        shopName: args.shopName,
        shopAddress: args.shopAddress,
        shopLat: args.shopLat,
        shopLng: args.shopLng,
        verificationStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      });

      return { success: true, redirect: "/chemist" };
    }
  },
});
