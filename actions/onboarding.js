"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { userId, getToken } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const token = await getToken({ template: "convex" });

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR", "CHEMIST"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    if (role === "PATIENT") {
      await fetchMutation(
        api.users.setUserRole,
        { role: "PATIENT" },
        { token }
      );
      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All fields are required");
      }

      await fetchMutation(
        api.users.setUserRole,
        {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
        },
        { token }
      );

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }

    if (role === "CHEMIST") {
      const licenseUrl = formData.get("licenseUrl");
      const shopName = formData.get("shopName");
      const shopAddress = formData.get("shopAddress");
      const shopLatStr = formData.get("shopLat");
      const shopLngStr = formData.get("shopLng");

      if (!licenseUrl || !shopName || !shopAddress) {
        throw new Error("Required fields are missing for chemist registration");
      }

      await fetchMutation(
        api.users.setUserRole,
        {
          role: "CHEMIST",
          licenseUrl,
          shopName,
          shopAddress,
          shopLat: shopLatStr ? parseFloat(shopLatStr) : undefined,
          shopLng: shopLngStr ? parseFloat(shopLngStr) : undefined,
        },
        { token }
      );

      revalidatePath("/");
      return { success: true, redirect: "/chemist" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  try {
    console.log("NEXT_PUBLIC_CONVEX_URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
    const token = await getToken({ template: "convex" });
    const user = await fetchMutation(
      api.users.checkUser,
      {},
      { token }
    );
    
    // Some frontend components might expect user.id instead of user._id
    if (user) {
      user.id = user._id;
    }

    return user;
  } catch (error) {
    console.error("Failed to get user information:", error?.message || error?.data || JSON.stringify(error));
    return null;
  }
}
