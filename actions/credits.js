"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function checkAndAllocateCredits(user) {
  try {
    if (!user || user.role !== "PATIENT") {
      return user;
    }

    const { has, getToken } = await auth();

    const hasBasic = has({ plan: "free_user" });
    const hasStandard = has({ plan: "standard" });
    const hasPremium = has({ plan: "premium" });

    let currentPlan = null;

    if (hasPremium) {
      currentPlan = "premium";
    } else if (hasStandard) {
      currentPlan = "standard";
    } else if (hasBasic) {
      currentPlan = "free_user";
    }

    if (!currentPlan) {
      return user;
    }

    const token = await getToken({ template: "convex" });
    const updatedUser = await fetchMutation(
      api.credits.checkAndAllocateCredits,
      { plan: currentPlan },
      { token }
    );

    revalidatePath("/doctors");
    revalidatePath("/appointments");

    return updatedUser ? { ...updatedUser, id: updatedUser._id } : user;
  } catch (error) {
    console.error("Failed to check subscription and allocate credits:", error.message);
    return null;
  }
}

export async function deductCreditsForAppointment(userId, doctorId) {
  // We do not export this anymore for direct frontend usage since bookAppointment handles it internally in convex.
  // Kept here if used elsewhere.
  const { getToken } = await auth();
  try {
    const token = await getToken({ template: "convex" });
    const result = await fetchMutation(
      api.credits.deductCreditsForAppointment,
      { userId, doctorId },
      { token }
    );
    return { success: true, user: result };
  } catch (error) {
    console.error("Failed to deduct credits:", error);
    return { success: false, error: error.message };
  }
}
