"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function setAvailabilitySlots(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const token = await getToken({ template: "convex" });
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");

  try {
    const res = await fetchMutation(
      api.doctor.setAvailabilitySlots,
      { startTime, endTime },
      { token }
    );
    revalidatePath("/doctor");
    return res;
  } catch (error) {
    console.error("Failed to set availability slots:", error);
    throw new Error("Failed to set availability: " + error.message);
  }
}

export async function getDoctorAvailability() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const token = await getToken({ template: "convex" });

  try {
    const { slots } = await fetchQuery(api.doctor.getDoctorAvailability, {}, { token });
    const mapped = slots.map(s => ({ ...s, id: s._id }));
    return { slots: mapped };
  } catch (error) {
    throw new Error("Failed to fetch availability slots " + error.message);
  }
}

export async function getDoctorAppointments() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const token = await getToken({ template: "convex" });

  try {
    const { appointments } = await fetchQuery(api.doctor.getDoctorAppointments, {}, { token });
    const mapped = appointments.map(app => ({
      ...app,
      id: app._id,
      patient: { ...app.patient, id: app.patient._id }
    }));
    return { appointments: mapped };
  } catch (error) {
    throw new Error("Failed to fetch appointments " + error.message);
  }
}

export async function cancelAppointment(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const token = await getToken({ template: "convex" });
  const appointmentId = formData.get("appointmentId");

  try {
    await fetchMutation(
      api.doctor.cancelAppointment,
      { appointmentId },
      { token }
    );

    // We can't know role cleanly here without fetching user, just revalidate both
    revalidatePath("/doctor");
    revalidatePath("/appointments");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    throw new Error("Failed to cancel appointment: " + error.message);
  }
}

export async function addAppointmentNotes(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const token = await getToken({ template: "convex" });
  const appointmentId = formData.get("appointmentId");
  const notes = formData.get("notes");

  try {
    const res = await fetchMutation(
      api.doctor.addAppointmentNotes,
      { appointmentId, notes },
      { token }
    );
    revalidatePath("/doctor");
    return { success: true, appointment: { ...res.appointment, id: res.appointment._id } };
  } catch (error) {
    console.error("Failed to add appointment notes:", error);
    throw new Error("Failed to update notes: " + error.message);
  }
}

export async function markAppointmentCompleted(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const token = await getToken({ template: "convex" });
  const appointmentId = formData.get("appointmentId");

  try {
    const res = await fetchMutation(
      api.doctor.markAppointmentCompleted,
      { appointmentId },
      { token }
    );
    revalidatePath("/doctor");
    return { success: true, appointment: { ...res.appointment, id: res.appointment._id } };
  } catch (error) {
    console.error("Failed to mark appointment as completed:", error);
    throw new Error("Failed to mark appointment as completed: " + error.message);
  }
}
