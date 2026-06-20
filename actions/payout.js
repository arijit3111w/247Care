"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function requestPayout(formData) {
  const { userId, getToken } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const paypalEmail = formData.get("paypalEmail");
    if (!paypalEmail) {
      throw new Error("PayPal email is required");
    }

    const token = await getToken({ template: "convex" });
    const { payout } = await fetchMutation(
      api.payout.requestPayout,
      { paypalEmail },
      { token }
    );

    revalidatePath("/doctor");
    return { success: true, payout: { ...payout, id: payout._id } };
  } catch (error) {
    console.error("Failed to request payout:", error);
    throw new Error("Failed to request payout: " + error.message);
  }
}

export async function getDoctorPayouts() {
  const { userId, getToken } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const token = await getToken({ template: "convex" });
    const { payouts } = await fetchQuery(api.payout.getDoctorPayouts, {}, { token });
    return { payouts: payouts.map(p => ({...p, id: p._id})) };
  } catch (error) {
    throw new Error("Failed to fetch payouts: " + error.message);
  }
}

export async function getDoctorEarnings() {
  const { userId, getToken } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const token = await getToken({ template: "convex" });
    const { earnings } = await fetchQuery(api.payout.getDoctorEarnings, {}, { token });
    return { earnings };
  } catch (error) {
    throw new Error("Failed to fetch doctor earnings: " + error.message);
  }
}
