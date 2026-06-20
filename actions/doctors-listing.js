"use server";

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Get doctors by specialty
 */
export async function getDoctorsBySpecialty(specialty) {
  try {
    const formattedSpecialty = specialty.split("%20").join(" ");
    
    // In Convex, we created `getVerifiedDoctors` but we need to filter by specialty.
    // Or we can fetch all verified and filter. Let's do that for now.
    const { doctors } = await fetchQuery(api.admin.getVerifiedDoctors);
    
    const filteredDoctors = doctors.filter(d => d.specialty === formattedSpecialty);
    
    // Map _id to id
    const mapped = filteredDoctors.map(d => ({...d, id: d._id}));
    
    return { doctors: mapped };
  } catch (error) {
    console.error("Failed to fetch doctors by specialty:", error);
    return { error: "Failed to fetch doctors" };
  }
}
