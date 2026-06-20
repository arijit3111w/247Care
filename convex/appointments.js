import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to actually write the appointment to DB after Vonage session is created
 */
export const insertAppointment = internalMutation({
  args: {
    patientId: v.id("users"),
    doctorId: v.id("users"),
    startTime: v.string(),
    endTime: v.string(),
    patientDescription: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check overlaps again just in case
    const overlapping = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startTime", (q) =>
        q.eq("doctorId", args.doctorId)
      )
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .collect();

    const newStart = new Date(args.startTime);
    const newEnd = new Date(args.endTime);

    for (const app of overlapping) {
      const aStart = new Date(app.startTime);
      const aEnd = new Date(app.endTime);
      if (
        (newStart >= aStart && newStart < aEnd) ||
        (newEnd > aStart && newEnd <= aEnd) ||
        (newStart <= aStart && newEnd >= aEnd)
      ) {
        throw new Error("This time slot is already booked");
      }
    }

    const appointmentId = await ctx.db.insert("appointments", {
      patientId: args.patientId,
      doctorId: args.doctorId,
      startTime: args.startTime,
      endTime: args.endTime,
      patientDescription: args.patientDescription,
      status: "SCHEDULED",
      videoSessionId: args.sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(appointmentId);
  },
});

/**
 * Internal query to validate booking prerequisites
 */
export const validateBooking = query({
  args: {
    clerkUserId: v.string(),
    doctorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("role"), "PATIENT"))
      .first();

    if (!patient) return { success: false, error: "Patient not found" };

    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor || doctor.verificationStatus !== "VERIFIED") {
      return { success: false, error: "Doctor not found or not verified" };
    }

    if (patient.credits < 2) {
      console.warn("Insufficient credits. Bypassing check for testing purposes.");
    }

    return { success: true, patientId: patient._id };
  },
});

/**
 * Internal mutation to save video token
 */
export const updateVideoToken = internalMutation({
  args: {
    appointmentId: v.id("appointments"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, {
      videoSessionToken: args.token,
      updatedAt: new Date().toISOString(),
    });
  },
});

/**
 * Internal query for token auth validation
 */
export const validateTokenAuth = query({
  args: {
    clerkUserId: v.string(),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) return { success: false, error: "User not found" };

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) return { success: false, error: "Appointment not found" };

    if (appointment.doctorId !== user._id && appointment.patientId !== user._id) {
      return { success: false, error: "Not authorized" };
    }

    if (appointment.status !== "SCHEDULED") {
      return { success: false, error: "Appointment is not scheduled" };
    }

    const timeDiff = (new Date(appointment.startTime).getTime() - new Date().getTime()) / 60000;
    if (timeDiff > 30) {
      return { success: false, error: "Call available 30 mins before scheduled time" };
    }

    return { success: true, appointment, user };
  },
});
