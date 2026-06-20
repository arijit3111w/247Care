"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Vonage } from "@vonage/server-sdk";
import { Auth } from "@vonage/auth";

const privateKey = process.env.VONAGE_PRIVATE_KEY_BASE64 
  ? Buffer.from(process.env.VONAGE_PRIVATE_KEY_BASE64, 'base64').toString('ascii')
  : (process.env.VONAGE_PRIVATE_KEY ? process.env.VONAGE_PRIVATE_KEY.replace(/\\n/g, '\n') : "");

const credentials = new Auth({
  applicationId: process.env.VONAGE_APPLICATION_ID,
  privateKey: privateKey,
});
const vonage = new Vonage(credentials, {});

/**
 * Action to book an appointment (creates Vonage session then calls internal mutation)
 */
export const bookAppointment = action({
  args: {
    doctorId: v.id("users"),
    startTime: v.string(),
    endTime: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const validation = await ctx.runQuery(internal.appointments.validateBooking, {
      clerkUserId: identity.subject,
      doctorId: args.doctorId,
    });

    if (!validation.success) {
      throw new Error(validation.error);
    }

    await ctx.runMutation(internal.credits.deductCreditsForAppointment, {
      userId: validation.patientId,
      doctorId: args.doctorId,
    });

    let sessionId;
    try {
      const session = await vonage.video.createSession({ mediaMode: "routed" });
      sessionId = session.sessionId;
    } catch (e) {
      throw new Error("Failed to create video session: " + e.message);
    }

    const appointment = await ctx.runMutation(internal.appointments.insertAppointment, {
      patientId: validation.patientId,
      doctorId: args.doctorId,
      startTime: args.startTime,
      endTime: args.endTime,
      patientDescription: args.description,
      sessionId,
    });

    return { success: true, appointment };
  },
});

/**
 * Action to generate video token
 */
export const generateVideoToken = action({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const authData = await ctx.runQuery(internal.appointments.validateTokenAuth, {
      clerkUserId: identity.subject,
      appointmentId: args.appointmentId,
    });

    if (!authData.success) throw new Error(authData.error);

    const { appointment, user } = authData;

    const expirationTime = Math.floor(new Date(appointment.endTime).getTime() / 1000) + 60 * 60;

    const connectionData = JSON.stringify({
      name: user.name,
      role: user.role,
      userId: user._id,
    });

    let token;
    try {
      token = vonage.video.generateClientToken(appointment.videoSessionId, {
        role: "publisher",
        expireTime: expirationTime,
        data: connectionData,
      });
    } catch (e) {
      throw new Error("Failed to generate token");
    }

    await ctx.runMutation(internal.appointments.updateVideoToken, {
      appointmentId: args.appointmentId,
      token,
    });

    return { success: true, videoSessionId: appointment.videoSessionId, token };
  },
});
