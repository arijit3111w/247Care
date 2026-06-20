"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchQuery, fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { addMinutes, format, isBefore, isSameDay, parse, parseISO } from "date-fns";

export async function bookAppointment(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const token = await getToken({ template: "convex" });
  const doctorId = formData.get("doctorId");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const description = formData.get("description");

  try {
    const res = await fetchAction(
      api.appointmentsNode.bookAppointment,
      { doctorId, startTime, endTime, description },
      { token }
    );
    revalidatePath("/appointments");
    return { success: true, appointment: { ...res.appointment, id: res.appointment._id } };
  } catch (error) {
    console.error("Failed to book appointment:", error);
    return { success: false, error: error.message };
  }
}

export async function getDoctorById(doctorId) {
  try {
    const doctor = await fetchQuery(api.public.getDoctorById, { doctorId });
    if (!doctor) return { error: "Doctor not found" };
    return { doctor: { ...doctor, id: doctor._id } };
  } catch (error) {
    console.error("Failed to fetch doctor details:", error);
    return { error: "Failed to fetch doctor details" };
  }
}

export async function getAvailableTimeSlots(doctorId) {
  try {
    const { slots: availabilitySlots, appointments: bookedAppointments } = 
      await fetchQuery(api.public.getDoctorAvailabilityAndAppointments, { doctorId });
      
    if (!availabilitySlots || availabilitySlots.length === 0) {
      return { days: [] };
    }

    const now = new Date();
    const next4Days = Array.from({ length: 4 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const days = next4Days.map((targetDate) => {
      const availableTimeSlots = [];
      
      availabilitySlots.forEach((slot) => {
        let currentStartTime = new Date(targetDate);
        currentStartTime.setHours(new Date(slot.startTime).getHours(), new Date(slot.startTime).getMinutes(), 0, 0);

        let currentEndTime = new Date(targetDate);
        currentEndTime.setHours(new Date(slot.endTime).getHours(), new Date(slot.endTime).getMinutes(), 0, 0);

        while (isBefore(currentStartTime, currentEndTime)) {
          const appointmentEndTime = addMinutes(currentStartTime, 30);
          const isPast = isBefore(currentStartTime, now);
          
          const isBooked = bookedAppointments.some((appointment) => {
            const bookedStart = new Date(appointment.startTime);
            const bookedEnd = new Date(appointment.endTime);
            return (
              (currentStartTime >= bookedStart && currentStartTime < bookedEnd) ||
              (appointmentEndTime > bookedStart && appointmentEndTime <= bookedEnd) ||
              (currentStartTime <= bookedStart && appointmentEndTime >= bookedEnd)
            );
          });

          if (!isPast && !isBooked) {
            availableTimeSlots.push({
              startTime: currentStartTime.toISOString(),
              endTime: appointmentEndTime.toISOString(),
              formatted: `${format(currentStartTime, "h:mm a")} - ${format(appointmentEndTime, "h:mm a")}`
            });
          }
          currentStartTime = appointmentEndTime;
        }
      });
      
      let displayDate = format(targetDate, "EEEE, MMMM d");
      if (isSameDay(targetDate, now)) {
        displayDate = "Today, " + format(targetDate, "MMMM d");
      } else if (isSameDay(targetDate, addMinutes(now, 24 * 60))) {
        displayDate = "Tomorrow, " + format(targetDate, "MMMM d");
      }

      return {
        date: targetDate.toISOString(),
        displayDate: displayDate,
        slots: availableTimeSlots
      };
    });

    return { days };
  } catch (error) {
    console.error("Failed to get available time slots:", error);
    return { days: [] };
  }
}

export async function generateVideoToken(formData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const appointmentId = formData.get("appointmentId");
  const token = await getToken({ template: "convex" });
  try {
    const res = await fetchAction(
      api.appointmentsNode.generateVideoToken,
      { appointmentId },
      { token }
    );
    return res;
  } catch (error) {
    console.error("Failed to generate video token:", error);
    throw new Error(error.message);
  }
}
