"use server";

import { Vonage } from "@vonage/server-sdk";
import fs from "fs";
import path from "path";

const getVonageClient = () => {
  const privateKey = process.env.VONAGE_PRIVATE_KEY ? process.env.VONAGE_PRIVATE_KEY.replace(/\\n/g, '\n') : "";

  return new Vonage({
    applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
    privateKey: privateKey,
  });
};

/**
 * Creates a new Vonage Video Session.
 * Useful when scheduling a new appointment.
 */
export const createVonageSession = async () => {
  try {
    const vonage = getVonageClient();
    const session = await vonage.video.createSession({ mediaMode: "routed" });
    return session.sessionId;
  } catch (error) {
    console.error("Error creating Vonage session:", error);
    throw new Error("Failed to create Vonage session");
  }
};

/**
 * Generates a client token for a specific Video Session.
 * Useful when a user joins the video call room.
 */
export const generateVonageToken = async (sessionId) => {
  try {
    const vonage = getVonageClient();
    
    // Generate a token valid for 24 hours with publisher role
    const token = vonage.video.generateClientToken(sessionId, {
      role: "publisher",
      expireTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    });

    return token;
  } catch (error) {
    console.error("Error generating Vonage token:", error);
    throw new Error("Failed to generate Vonage token");
  }
};
