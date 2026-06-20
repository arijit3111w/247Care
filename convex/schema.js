import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.string(), // "UNASSIGNED", "PATIENT", "DOCTOR", "ADMIN"
    createdAt: v.string(), // ISO string
    updatedAt: v.string(), // ISO string
    
    
    // Patient-specific fields
    credits: v.number(), // default 2
    
    // Doctor-specific fields
    specialty: v.optional(v.string()),
    experience: v.optional(v.number()),
    credentialUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    verificationStatus: v.optional(v.string()), // "PENDING", "VERIFIED", "REJECTED"
    
    // Chemist-specific fields
    licenseUrl: v.optional(v.string()),
    shopName: v.optional(v.string()),
    shopAddress: v.optional(v.string()),
    shopLat: v.optional(v.number()),
    shopLng: v.optional(v.number()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"]),

  availabilities: defineTable({
    doctorId: v.id("users"),
    startTime: v.string(), // ISO string
    endTime: v.string(),   // ISO string
    status: v.string(),    // "AVAILABLE", "BOOKED", "BLOCKED"
  })
    .index("by_doctorId", ["doctorId"])
    .index("by_doctorId_startTime", ["doctorId", "startTime"]),

  appointments: defineTable({
    patientId: v.id("users"),
    doctorId: v.id("users"),
    startTime: v.string(), // ISO string
    endTime: v.string(),   // ISO string
    status: v.string(),    // "SCHEDULED", "COMPLETED", "CANCELLED"
    notes: v.optional(v.string()),
    patientDescription: v.optional(v.string()),
    
    // Video session fields
    videoSessionId: v.optional(v.string()),
    videoSessionToken: v.optional(v.string()),
    
    createdAt: v.string(), // ISO string
    updatedAt: v.string(), // ISO string
  })
    .index("by_patientId", ["patientId"])
    .index("by_doctorId", ["doctorId"])
    .index("by_status_startTime", ["status", "startTime"])
    .index("by_doctorId_startTime", ["doctorId", "startTime"]),

  creditTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(), // "CREDIT_PURCHASE", "APPOINTMENT_DEDUCTION", "ADMIN_ADJUSTMENT"
    packageId: v.optional(v.string()),
    createdAt: v.string(), // ISO string
  })
    .index("by_userId", ["userId"]),

  payouts: defineTable({
    doctorId: v.id("users"),
    amount: v.number(),
    credits: v.number(),
    platformFee: v.number(),
    netAmount: v.number(),
    paypalEmail: v.string(),
    status: v.string(), // "PROCESSING", "PROCESSED"
    createdAt: v.string(), // ISO string
    updatedAt: v.string(), // ISO string
    processedAt: v.optional(v.string()), // ISO string
    processedBy: v.optional(v.string()), // Admin clerkUserId or Name
  })
    .index("by_doctorId", ["doctorId"])
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_doctorId_status", ["doctorId", "status"]),

  medicines: defineTable({
    pharmacyId: v.id("users"),
    medicineName: v.string(),
    quantity: v.number(),
    price: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_pharmacyId", ["pharmacyId"])
    .index("by_medicineName", ["medicineName"]),

  prescriptions: defineTable({
    patientId: v.id("users"),
    doctorId: v.id("users"),
    appointmentId: v.id("appointments"),
    pdfStorageId: v.id("_storage"),
    createdAt: v.string(),
  })
    .index("by_patientId", ["patientId"])
    .index("by_appointmentId", ["appointmentId"])
    .index("by_doctorId", ["doctorId"]),
});
