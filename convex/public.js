import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDoctorById = query({
  args: { doctorId: v.id("users") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor || doctor.role !== "DOCTOR") return null;
    return doctor;
  }
});

export const getDoctorAvailabilityAndAppointments = query({
  args: { doctorId: v.id("users") },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("availabilities")
      .withIndex("by_doctorId", q => q.eq("doctorId", args.doctorId))
      .collect();
      
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", q => q.eq("doctorId", args.doctorId))
      .filter(q => q.eq(q.field("status"), "SCHEDULED"))
      .collect();
      
    return { slots, appointments };
  }
});
