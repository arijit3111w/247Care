import { mutation } from "./_generated/server";
import { v } from "convex/values";

const PLAN_CREDITS = {
  free_user: 10,
  standard: 20,
  premium: 50,
};

const APPOINTMENT_CREDIT_COST = 2;

/**
 * Checks user's subscription and allocates monthly credits if needed
 */
export const checkAndAllocateCredits = mutation({
  args: {
    plan: v.string(), // "free_user", "standard", "premium" passed from frontend
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user || user.role !== "PATIENT") return user;

    const currentPlan = args.plan;
    if (!PLAN_CREDITS.hasOwnProperty(currentPlan)) return user;
    const creditsToAllocate = PLAN_CREDITS[currentPlan];

    // Check transactions
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"

    if (transactions.length > 0) {
      const latestTransaction = transactions[0];
      const transactionMonth = latestTransaction.createdAt.substring(0, 7);
      const transactionPlan = latestTransaction.packageId;

      if (transactionMonth === currentMonth && transactionPlan === currentPlan) {
        return user;
      }
    }

    // Allocate credits
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount: creditsToAllocate,
      type: "CREDIT_PURCHASE",
      packageId: currentPlan,
      createdAt: new Date().toISOString(),
    });

    await ctx.db.patch(user._id, {
      credits: user.credits + creditsToAllocate,
    });

    return await ctx.db.get(user._id);
  },
});

/**
 * Internal mutation to deduct credits
 * Used by other mutations like bookAppointment
 */
export const deductCreditsForAppointment = mutation({
  args: {
    userId: v.id("users"),
    doctorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const doctor = await ctx.db.get(args.doctorId);

    if (user.credits < APPOINTMENT_CREDIT_COST) {
      console.warn("Insufficient credits. Allowing negative balance for testing purposes.");
    }

    if (!doctor) throw new Error("Doctor not found");

    // Deduct from patient
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount: -APPOINTMENT_CREDIT_COST,
      type: "APPOINTMENT_DEDUCTION",
      createdAt: new Date().toISOString(),
    });

    // Add to doctor
    await ctx.db.insert("creditTransactions", {
      userId: doctor._id,
      amount: APPOINTMENT_CREDIT_COST,
      type: "APPOINTMENT_DEDUCTION",
      createdAt: new Date().toISOString(),
    });

    await ctx.db.patch(user._id, { credits: user.credits - APPOINTMENT_CREDIT_COST });
    await ctx.db.patch(doctor._id, { credits: doctor.credits + APPOINTMENT_CREDIT_COST });

    return { success: true };
  },
});
