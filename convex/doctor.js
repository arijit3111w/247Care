import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Set doctor's availability slots
 */
export const setAvailabilitySlots = mutation({
  args: {
    startTime: v.string(),
    endTime: v.string(),
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

    if (!args.startTime || !args.endTime) {
      throw new Error("Start time and end time are required");
    }

    if (new Date(args.startTime) >= new Date(args.endTime)) {
      throw new Error("Start time must be before end time");
    }

    // Check existing slots
    const existingSlots = await ctx.db
      .query("availabilities")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();

    if (existingSlots.length > 0) {
      // In Prisma it didn't delete slots with appointments. We don't have appointment relation on availability here.
      // Assuming availability slots are standalone or we just delete all that are "AVAILABLE"
      const slotsToDelete = existingSlots.filter((s) => s.status === "AVAILABLE");
      for (const slot of slotsToDelete) {
        await ctx.db.delete(slot._id);
      }
    }

    // Create new availability slot
    const newSlotId = await ctx.db.insert("availabilities", {
      doctorId: doctor._id,
      startTime: args.startTime,
      endTime: args.endTime,
      status: "AVAILABLE",
    });

    return { success: true, slot: await ctx.db.get(newSlotId) };
  },
});

/**
 * Get doctor's current availability slots
 */
export const getDoctorAvailability = query({
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

    const slots = await ctx.db
      .query("availabilities")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();

    slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return { slots };
  },
});

/**
 * Get doctor's upcoming appointments
 */
export const getDoctorAppointments = query({
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

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .collect();

    const appointmentsWithPatient = await Promise.all(
      appointments.map(async (app) => {
        const patient = await ctx.db.get(app.patientId);
        const doctorObj = await ctx.db.get(app.doctorId);
        return {
          ...app,
          patient,
          doctor: doctorObj,
        };
      })
    );

    appointmentsWithPatient.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return { appointments: appointmentsWithPatient };
  },
});

/**
 * Cancel an appointment
 */
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    if (appointment.doctorId !== user._id && appointment.patientId !== user._id) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    // Perform cancellation
    await ctx.db.patch(args.appointmentId, { status: "CANCELLED", updatedAt: new Date().toISOString() });

    // Refund credits to patient
    await ctx.db.insert("creditTransactions", {
      userId: appointment.patientId,
      amount: 2,
      type: "APPOINTMENT_DEDUCTION",
      createdAt: new Date().toISOString(),
    });

    // Deduct credits from doctor
    await ctx.db.insert("creditTransactions", {
      userId: appointment.doctorId,
      amount: -2,
      type: "APPOINTMENT_DEDUCTION",
      createdAt: new Date().toISOString(),
    });

    const patient = await ctx.db.get(appointment.patientId);
    await ctx.db.patch(patient._id, { credits: patient.credits + 2 });

    const doctor = await ctx.db.get(appointment.doctorId);
    await ctx.db.patch(doctor._id, { credits: doctor.credits - 2 });

    return { success: true };
  },
});

/**
 * Add notes to an appointment
 */
export const addAppointmentNotes = mutation({
  args: {
    appointmentId: v.id("appointments"),
    notes: v.string(),
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

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.doctorId !== doctor._id) {
      throw new Error("Appointment not found");
    }

    await ctx.db.patch(args.appointmentId, {
      notes: args.notes,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, appointment: await ctx.db.get(args.appointmentId) };
  },
});

/**
 * Mark appointment as completed
 */
export const markAppointmentCompleted = mutation({
  args: {
    appointmentId: v.id("appointments"),
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

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.doctorId !== doctor._id) {
      throw new Error("Appointment not found or not authorized");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be marked as completed");
    }

    if (new Date() < new Date(appointment.endTime)) {
      throw new Error("Cannot mark appointment as completed before the scheduled end time");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
    });

    return { success: true, appointment: await ctx.db.get(args.appointmentId) };
  },
});
