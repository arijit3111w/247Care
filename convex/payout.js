import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CREDIT_VALUE = 10;
const PLATFORM_FEE_PER_CREDIT = 2;
const DOCTOR_EARNINGS_PER_CREDIT = 8;

export const requestPayout = mutation({
  args: {
    paypalEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const doctor = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .filter((q) => q.eq(q.field("role"), "DOCTOR"))
      .first();

    if (!doctor) throw new Error("Doctor not found");

    const existingPendingPayout = await ctx.db
      .query("payouts")
      .withIndex("by_doctorId_status", (q) => q.eq("doctorId", doctor._id).eq("status", "PROCESSING"))
      .first();

    if (existingPendingPayout) {
      throw new Error("You already have a pending payout request.");
    }

    const creditCount = doctor.credits;
    if (creditCount < 1) {
      throw new Error("Minimum 1 credit required for payout");
    }

    const totalAmount = creditCount * CREDIT_VALUE;
    const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
    const netAmount = creditCount * DOCTOR_EARNINGS_PER_CREDIT;

    const payoutId = await ctx.db.insert("payouts", {
      doctorId: doctor._id,
      amount: totalAmount,
      credits: creditCount,
      platformFee,
      netAmount,
      paypalEmail: args.paypalEmail,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, payout: await ctx.db.get(payoutId) };
  },
});

export const getDoctorPayouts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const doctor = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .filter((q) => q.eq(q.field("role"), "DOCTOR"))
      .first();

    if (!doctor) throw new Error("Doctor not found");

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();

    payouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { payouts };
  },
});

export const getDoctorEarnings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const doctor = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .filter((q) => q.eq(q.field("role"), "DOCTOR"))
      .first();

    if (!doctor) throw new Error("Doctor not found");

    const completedAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.eq(q.field("status"), "COMPLETED"))
      .collect();

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (app) => new Date(app.createdAt) >= currentMonth
    );

    const totalEarnings = doctor.credits * DOCTOR_EARNINGS_PER_CREDIT;
    const thisMonthEarnings = thisMonthAppointments.length * 2 * DOCTOR_EARNINGS_PER_CREDIT;
    const averageEarningsPerMonth =
      totalEarnings > 0 ? totalEarnings / Math.max(1, new Date().getMonth() + 1) : 0;
    
    const availableCredits = doctor.credits;
    const availablePayout = availableCredits * DOCTOR_EARNINGS_PER_CREDIT;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
      },
    };
  },
});
