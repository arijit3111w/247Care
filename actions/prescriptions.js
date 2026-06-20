"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateUploadUrl() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    
    const token = await getToken({ template: "convex" });

    const uploadUrl = await fetchMutation(
      api.prescriptions.generateUploadUrl,
      {},
      { token: token ?? undefined }
    );
    return { success: true, uploadUrl };
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return { success: false, error: "Failed to generate upload URL: " + error.message };
  }
}

export async function savePrescription(formData) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    
    const token = await getToken({ template: "convex" });
    const patientId = formData.get("patientId");
    const appointmentId = formData.get("appointmentId");
    const pdfStorageId = formData.get("pdfStorageId");

    const prescriptionId = await fetchMutation(
      api.prescriptions.savePrescription,
      { patientId, appointmentId, pdfStorageId },
      { token: token ?? undefined }
    );
    
    // Revalidate paths where prescriptions might be displayed
    revalidatePath("/prescriptions");
    revalidatePath("/appointments");
    revalidatePath("/doctor");
    
    return { success: true, prescriptionId };
  } catch (error) {
    console.error("Failed to save prescription:", error);
    return { success: false, error: "Failed to save prescription: " + error.message };
  }
}

export async function getPatientPrescriptions() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return { prescriptions: [], error: "Unauthorized" };
    }
    
    const token = await getToken({ template: "convex" });

    const prescriptions = await fetchQuery(
      api.prescriptions.getPatientPrescriptions,
      {},
      { token: token ?? undefined }
    );
    
    return { prescriptions };
  } catch (error) {
    console.error("Failed to fetch prescriptions:", error);
    return { prescriptions: [], error: error.message || "Failed to fetch prescriptions" };
  }
}

export async function getAppointmentPrescription(formData) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return { prescription: null, error: "Unauthorized" };
    
    const token = await getToken({ template: "convex" });
    const appointmentId = formData.get("appointmentId");

    const prescription = await fetchQuery(
      api.prescriptions.getAppointmentPrescription,
      { appointmentId },
      { token: token ?? undefined }
    );
    return { prescription };
  } catch (error) {
    console.error("Failed to fetch appointment prescription:", error);
    return { prescription: null, error: "Failed to fetch appointment prescription: " + error.message };
  }
}
