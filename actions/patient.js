"use server";

import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Get all appointments for the authenticated patient
 */
export async function getPatientAppointments() {
  const { userId, getToken } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const token = await getToken({ template: "convex" });
    const { appointments } = await fetchQuery(
      api.patient.getPatientAppointments,
      {},
      { token }
    );

    // Some components might map over id instead of _id
    const mapped = appointments.map(app => ({
      ...app,
      id: app._id,
      doctor: {
        ...app.doctor,
        id: app.doctor.id, // we mapped doctor._id to id in backend
      }
    }));

    return { appointments: mapped };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
