import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all appointments for the authenticated patient
 */
export const getPatientAppointments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .filter((q) => q.eq(q.field("role"), "PATIENT"))
      .first();

    if (!user) {
      throw new Error("Patient not found");
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", user._id))
      .collect();

    // Join with doctor details and sort by startTime asc
    const appointmentsWithDoctor = await Promise.all(
      appointments.map(async (app) => {
        const doctor = await ctx.db.get(app.doctorId);
        return {
          ...app,
          doctor: {
            id: doctor._id,
            name: doctor.name,
            specialty: doctor.specialty,
            imageUrl: doctor.imageUrl,
          },
        };
      })
    );

    appointmentsWithDoctor.sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    return { appointments: appointmentsWithDoctor };
  },
});
