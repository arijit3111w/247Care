import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to verify admin
 */
async function verifyAdmin(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();

  return user?.role === "ADMIN";
}

export const getPendingDoctors = query({
  args: {},
  handler: async (ctx) => {
    const isAdmin = await verifyAdmin(ctx);
    if (!isAdmin) throw new Error("Unauthorized");

    const doctors = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.or(q.eq(q.field("role"), "DOCTOR"), q.eq(q.field("role"), "CHEMIST")), 
          q.eq(q.field("verificationStatus"), "PENDING")
        )
      )
      .collect();

    doctors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { doctors };
  },
});

export const getVerifiedDoctors = query({
  args: {},
  handler: async (ctx) => {

    const doctors = await ctx.db
      .query("users")
      .filter((q) => q.and(q.eq(q.field("role"), "DOCTOR"), q.eq(q.field("verificationStatus"), "VERIFIED")))
      .collect();

    doctors.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return { doctors };
  },
});

export const getVerifiedChemists = query({
  args: {},
  handler: async (ctx) => {
    const chemists = await ctx.db
      .query("users")
      .filter((q) => q.and(q.eq(q.field("role"), "CHEMIST"), q.eq(q.field("verificationStatus"), "VERIFIED")))
      .collect();

    chemists.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return { chemists };
  },
});

export const updateDoctorStatus = mutation({
  args: {
    doctorId: v.id("users"),
    status: v.string(), // "VERIFIED" or "REJECTED"
  },
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx);
    if (!isAdmin) throw new Error("Unauthorized");

    if (!["VERIFIED", "REJECTED"].includes(args.status)) {
      throw new Error("Invalid status");
    }

    await ctx.db.patch(args.doctorId, {
      verificationStatus: args.status,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const updateDoctorActiveStatus = mutation({
  args: {
    doctorId: v.id("users"),
    suspend: v.boolean(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx);
    if (!isAdmin) throw new Error("Unauthorized");

    const status = args.suspend ? "PENDING" : "VERIFIED";

    await ctx.db.patch(args.doctorId, {
      verificationStatus: status,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

export const getPendingPayouts = query({
  args: {},
  handler: async (ctx) => {
    const isAdmin = await verifyAdmin(ctx);
    if (!isAdmin) throw new Error("Unauthorized");

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "PROCESSING"))
      .collect();

    const payoutsWithDoctor = await Promise.all(
      payouts.map(async (p) => {
        const doctor = await ctx.db.get(p.doctorId);
        return {
          ...p,
          doctor: {
            id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialty: doctor.specialty,
            credits: doctor.credits,
          },
        };
      })
    );

    payoutsWithDoctor.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { payouts: payoutsWithDoctor };
  },
});

export const approvePayout = mutation({
  args: {
    payoutId: v.id("payouts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!admin || admin.role !== "ADMIN") throw new Error("Unauthorized");

    const payout = await ctx.db.get(args.payoutId);
    if (!payout || payout.status !== "PROCESSING") {
      throw new Error("Payout request not found or already processed");
    }

    const doctor = await ctx.db.get(payout.doctorId);
    if (doctor.credits < payout.credits) {
      throw new Error("Doctor doesn't have enough credits for this payout");
    }

    await ctx.db.patch(args.payoutId, {
      status: "PROCESSED",
      processedAt: new Date().toISOString(),
      processedBy: admin._id,
      updatedAt: new Date().toISOString(),
    });

    await ctx.db.patch(doctor._id, {
      credits: doctor.credits - payout.credits,
    });

    await ctx.db.insert("creditTransactions", {
      userId: doctor._id,
      amount: -payout.credits,
      type: "ADMIN_ADJUSTMENT",
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
