"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function verifyAdmin() {
  const { userId, getToken } = await auth();
  if (!userId) return false;
  try {
    const token = await getToken({ template: "convex" });
    const user = await fetchMutation(api.users.checkUser, {}, { token });
    return user?.role === "ADMIN";
  } catch (error) {
    return false;
  }
}

export async function getPendingDoctors() {
  const { getToken } = await auth();
  try {
    const token = await getToken({ template: "convex" });
    const { doctors } = await fetchQuery(api.admin.getPendingDoctors, {}, { token });
    return { doctors: doctors.map(d => ({...d, id: d._id})) };
  } catch (error) {
    throw new Error("Failed to fetch pending doctors");
  }
}

export async function getVerifiedDoctors() {
  try {
    const { doctors } = await fetchQuery(api.admin.getVerifiedDoctors);
    return { doctors: doctors.map(d => ({...d, id: d._id})) };
  } catch (error) {
    console.error("Failed to get verified doctors:", error);
    return { error: "Failed to fetch verified doctors" };
  }
}

export async function getVerifiedChemists() {
  try {
    const { chemists } = await fetchQuery(api.admin.getVerifiedChemists);
    return { chemists: chemists.map(d => ({...d, id: d._id})) };
  } catch (error) {
    console.error("Failed to get verified chemists:", error);
    return { error: "Failed to fetch verified chemists" };
  }
}

export async function updateDoctorStatus(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const token = await getToken({ template: "convex" });
    const doctorId = formData.get("doctorId");
    const status = formData.get("status");

    await fetchMutation(api.admin.updateDoctorStatus, { doctorId, status }, { token });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor status:", error);
    if (error.errors) console.error("Clerk errors:", JSON.stringify(error.errors, null, 2));
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

export async function updateDoctorActiveStatus(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const token = await getToken({ template: "convex" });
    const doctorId = formData.get("doctorId");
    const suspend = formData.get("suspend") === "true";

    await fetchMutation(api.admin.updateDoctorActiveStatus, { doctorId, suspend }, { token });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor active status:", error);
    if (error.errors) console.error("Clerk errors:", JSON.stringify(error.errors, null, 2));
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

export async function getPendingPayouts() {
  const { getToken } = await auth();
  try {
    const token = await getToken({ template: "convex" });
    const { payouts } = await fetchQuery(api.admin.getPendingPayouts, {}, { token });
    return { payouts: payouts.map(p => ({...p, id: p._id, doctor: {...p.doctor, id: p.doctor.id}})) };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    throw new Error("Failed to fetch pending payouts");
  }
}

export async function approvePayout(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const token = await getToken({ template: "convex" });
    const payoutId = formData.get("payoutId");

    await fetchMutation(api.admin.approvePayout, { payoutId }, { token });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve payout:", error);
    if (error.errors) console.error("Clerk errors:", JSON.stringify(error.errors, null, 2));
    throw new Error(`Failed to approve payout: ${error.message}`);
  }
}
