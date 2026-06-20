import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for the PDF
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save the prescription to the database
export const savePrescription = mutation({
  args: {
    patientId: v.id("users"),
    appointmentId: v.id("appointments"),
    pdfStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get doctor user
    const doctorUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!doctorUser || doctorUser.role !== "DOCTOR") {
      throw new Error("Unauthorized: Only doctors can save prescriptions");
    }

    // Check if appointment exists
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // ROBUSTNESS: Ensure no duplicate prescription exists for this appointment
    const existingPrescription = await ctx.db
      .query("prescriptions")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .first();

    if (existingPrescription) {
      throw new Error("A prescription has already been generated for this appointment. It cannot be overwritten.");
    }

    // Insert prescription
    const prescriptionId = await ctx.db.insert("prescriptions", {
      patientId: args.patientId,
      doctorId: doctorUser._id,
      appointmentId: args.appointmentId,
      pdfStorageId: args.pdfStorageId,
      createdAt: new Date().toISOString(),
    });

    return prescriptionId;
  },
});

// Get prescriptions for a patient
export const getPatientPrescriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const patientUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!patientUser || patientUser.role !== "PATIENT") {
      throw new Error("Unauthorized: Only patients can view their prescriptions");
    }

    const prescriptions = await ctx.db
      .query("prescriptions")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientUser._id))
      .order("desc")
      .collect();

    // Map the prescriptions to include the URL and doctor details
    const mapped = await Promise.all(
      prescriptions.map(async (prescription) => {
        const url = await ctx.storage.getUrl(prescription.pdfStorageId);
        const doctor = await ctx.db.get(prescription.doctorId);
        const appointment = await ctx.db.get(prescription.appointmentId);

        return {
          ...prescription,
          pdfUrl: url,
          doctor: doctor
            ? {
                name: doctor.name,
                specialty: doctor.specialty,
              }
            : null,
          appointment: appointment
            ? {
                startTime: appointment.startTime,
              }
            : null,
        };
      })
    );

    return mapped;
  },
});

// Get a prescription for a specific appointment
export const getAppointmentPrescription = query({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Return null instead of crashing the UI during auth hydration
    }

    const prescription = await ctx.db
      .query("prescriptions")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .first();

    if (!prescription) {
      return null;
    }

    const url = await ctx.storage.getUrl(prescription.pdfStorageId);

    return {
      ...prescription,
      pdfUrl: url,
    };
  },
});
