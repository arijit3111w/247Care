"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { GsapReveal } from "@/components/gsap-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelAppointment,
  addAppointmentNotes,
  markAppointmentCompleted,
} from "@/actions/doctor";
import { generateVideoToken } from "@/actions/appointments";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generateUploadUrl, savePrescription } from "@/actions/prescriptions";
import { PrescriptionDocument, generatePrescriptionPDF } from "./prescription-document";

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null); // 'cancel', 'notes', 'video', or 'complete'
  const [notes, setNotes] = useState(appointment.notes || "");
  const [prescribedMedicines, setPrescribedMedicines] = useState("");
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const router = useRouter();

  // Fetch existing prescription if any
  const existingPrescription = useQuery(api.prescriptions.getAppointmentPrescription, {
    appointmentId: appointment.id,
  });

  // UseFetch hooks for server actions
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);
  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);
  const {
    loading: completeLoading,
    fn: submitMarkCompleted,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  // Format date and time
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format time only
  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  // Check if appointment can be marked as completed
  const canMarkCompleted = () => {
    if (userRole !== "DOCTOR" || appointment.status !== "SCHEDULED") {
      return false;
    }
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);
    return now >= appointmentEndTime;
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (cancelLoading) return;

    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitCancel(formData);
    }
  };

  // Handle mark as completed
  const handleMarkCompleted = async () => {
    if (completeLoading) return;

    // Check if appointment end time has passed
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      alert(
        "Cannot mark appointment as completed before the scheduled end time."
      );
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to mark this appointment as completed? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitMarkCompleted(formData);
    }
  };

  // Handle save notes & prescription
  const handleSavePrescription = async () => {
    if (notesLoading || userRole !== "DOCTOR" || isGeneratingPrescription) return;

    try {
      setIsGeneratingPrescription(true);

      // 1. First, save the notes to the appointment
      const notesFormData = new FormData();
      notesFormData.append("appointmentId", appointment.id);
      notesFormData.append("notes", notes);
      await submitNotes(notesFormData);

      // 2. Generate PDF and Upload if medicines are provided
      if (prescribedMedicines.trim() !== "") {
        toast.info("Generating official PDF prescription...");
        const pdfBlob = await generatePrescriptionPDF("prescription-render-target");
        
        if (pdfBlob) {
          // Generate upload URL
          const uploadResponse = await generateUploadUrl();
          if (!uploadResponse || !uploadResponse.success || !uploadResponse.uploadUrl) {
            toast.error(uploadResponse?.error || "Network error: Failed to reach server. Please try again.");
            setIsGeneratingPrescription(false);
            return;
          }
          const { uploadUrl } = uploadResponse;
          
          // Upload Blob
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/pdf" },
            body: pdfBlob,
          });
          const { storageId } = await result.json();

          // Save Prescription Record
          const prescriptionFormData = new FormData();
          prescriptionFormData.append("patientId", appointment.patientId || appointment.patient.id);
          prescriptionFormData.append("appointmentId", appointment.id);
          prescriptionFormData.append("pdfStorageId", storageId);
          await savePrescription(prescriptionFormData);
          
          toast.success("Prescription generated and saved successfully!");
        } else {
          toast.error("Failed to generate PDF. Notes were saved.");
        }
      } else {
        toast.success("Notes saved successfully");
      }
      
      setAction(null);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  // Handle join video call
  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;

    setAction("video");

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitTokenRequest(formData);
  };

  // Handle successful operations
  useEffect(() => {
    if (cancelData?.success) {
      toast.success("Appointment cancelled successfully");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [cancelData, refetchAppointments, router]);

  useEffect(() => {
    if (completeData?.success) {
      toast.success("Appointment marked as completed");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [completeData, refetchAppointments, router]);

  useEffect(() => {
    // We handle the success in the `handleSavePrescription` function directly now.
    // This allows us to orchestrate the PDF generation after the notes are saved.
  }, [notesData, refetchAppointments, router]);

  useEffect(() => {
    if (tokenData?.success) {
      // Redirect to video call page with token and session ID
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`
      );
    } else if (tokenData?.error) {
      setAction(null);
    }
  }, [tokenData, appointment.id, router]);

  // Determine if appointment is active (within 30 minutes of start time)
  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    // Can join 30 minutes before start until end time
    return (
      (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  // Determine other party information based on user role
  const otherParty =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;

  const otherPartyLabel = userRole === "DOCTOR" ? "Patient" : "Doctor";
  const otherPartyIcon = userRole === "DOCTOR" ? <User /> : <Stethoscope />;

  return (
    <>
      <GsapReveal delay={0.1}>
        <div className="border border-[#1a1a1a] bg-[#050505] hover:bg-[#0a0a0a] hover:border-emerald-900/40 transition-all duration-300 rounded-sm relative overflow-hidden group">
          {/* Subtle left glow line on hover */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-[#0f0f0f] border border-[#222] rounded-sm p-2.5 mt-0.5 shrink-0">
                  <div className="text-emerald-500">
                    {otherPartyIcon}
                  </div>
                </div>
                <div>
                  <h3 className="font-mono font-bold text-lg tracking-tight text-[#e0e0e0]">
                    {userRole === "DOCTOR"
                      ? otherParty.name
                      : `Dr. ${otherParty.name}`}
                  </h3>
                  {userRole === "DOCTOR" && (
                    <p className="text-sm font-mono text-[#666] mt-0.5">
                      {otherParty.email}
                    </p>
                  )}
                  {userRole === "PATIENT" && (
                    <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-500/70 mt-1">
                      {otherParty.specialty}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3">
                    <div className="flex items-center text-[12px] font-mono text-[#888]">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                      <span>{formatDateTime(appointment.startTime)}</span>
                    </div>
                    <div className="flex items-center text-[12px] font-mono text-[#888]">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                      <span>
                        {formatTime(appointment.startTime)} -{" "}
                        {formatTime(appointment.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1a1a1a]">
                <Badge
                  variant="outline"
                  className={
                    appointment.status === "COMPLETED"
                      ? "bg-emerald-900/10 border-emerald-900/30 text-emerald-500 font-mono text-[10px] rounded-sm uppercase tracking-wider"
                      : appointment.status === "CANCELLED"
                      ? "bg-red-900/10 border-red-900/30 text-red-500 font-mono text-[10px] rounded-sm uppercase tracking-wider"
                      : "bg-amber-900/10 border-amber-900/30 text-amber-500 font-mono text-[10px] rounded-sm uppercase tracking-wider"
                  }
                >
                  [{appointment.status}]
                </Badge>
                <div className="flex gap-2 w-full sm:w-auto justify-end mt-1">
                  {canMarkCompleted() && (
                    <Button
                      size="sm"
                      onClick={handleMarkCompleted}
                      disabled={completeLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto rounded-sm font-mono text-xs h-8"
                    >
                      {completeLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Complete
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#333] bg-transparent text-[#999] hover:bg-[#111] hover:text-white w-full sm:w-auto rounded-sm font-mono text-xs h-8 transition-colors"
                    onClick={() => setOpen(true)}
                  >
                    sudo view_details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GsapReveal>

      {/* Appointment Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-4 md:p-6 bg-[#060a0c]/95 backdrop-blur-2xl border-emerald-500/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-bold text-white">
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === "SCHEDULED"
                ? "Manage your upcoming appointment"
                : "View appointment information"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Left Column - Info */}
              <div className="space-y-6">
                {/* Other Party Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {otherPartyLabel}
                  </h4>
                  <div className="flex items-center">
                    <div className="h-5 w-5 text-emerald-400 mr-2">
                      {otherPartyIcon}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {userRole === "DOCTOR"
                          ? otherParty.name
                          : `Dr. ${otherParty.name}`}
                      </p>
                      {userRole === "DOCTOR" && (
                        <p className="text-muted-foreground text-sm">
                          {otherParty.email}
                        </p>
                      )}
                      {userRole === "PATIENT" && (
                        <p className="text-muted-foreground text-sm">
                          {otherParty.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Time */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Scheduled Time
                  </h4>
                  <div className="flex flex-col gap-2 bg-muted/10 p-3 rounded-md border border-emerald-900/20">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-emerald-400 mr-3" />
                      <p className="text-white">
                        {formatDateTime(appointment.startTime)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-emerald-400 mr-3" />
                      <p className="text-white">
                        {formatTime(appointment.startTime)} -{" "}
                        {formatTime(appointment.endTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h4>
                  <Badge
                    variant="outline"
                    className={
                      appointment.status === "COMPLETED"
                        ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 px-3 py-1"
                        : appointment.status === "CANCELLED"
                        ? "bg-red-900/20 border-red-900/30 text-red-400 px-3 py-1"
                        : "bg-amber-900/20 border-amber-900/30 text-amber-400 px-3 py-1"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>

              {/* Right Column - Actions and Details */}
              <div className="space-y-6">
                {/* Patient Description */}
                {appointment.patientDescription && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {userRole === "DOCTOR"
                        ? "Patient Description"
                        : "Your Description"}
                    </h4>
                    <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20 max-h-[120px] overflow-y-auto custom-scrollbar">
                      <p className="text-white whitespace-pre-line text-sm break-words">
                        {appointment.patientDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* Join Video Call Button */}
                {appointment.status === "SCHEDULED" && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Video Consultation
                    </h4>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 h-auto whitespace-normal text-center"
                      disabled={
                        !isAppointmentActive() || action === "video" || tokenLoading
                      }
                      onClick={handleJoinVideoCall}
                    >
                      {tokenLoading || action === "video" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Preparing Video Call...
                        </>
                      ) : (
                        <>
                          <Video className="h-5 w-5 mr-2" />
                          {isAppointmentActive()
                            ? "Join Video Call"
                            : "Video call will be available 30 minutes before appointment"}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Doctor Notes & Prescription */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {existingPrescription ? "Prescription & Notes" : "Doctor Notes"}
                    </h4>
                    {userRole === "DOCTOR" &&
                      action !== "notes" &&
                      appointment.status !== "CANCELLED" && 
                      !existingPrescription && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAction("notes")}
                          className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          {appointment.notes ? "Edit Notes" : "Write Prescription"}
                        </Button>
                      )}
                  </div>

                  {userRole === "DOCTOR" && action === "notes" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Clinical Notes</label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Enter your clinical notes here..."
                          className="bg-background border-emerald-900/20 min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1 uppercase tracking-wider">Prescribed Medicines</label>
                        <Textarea
                          value={prescribedMedicines}
                          onChange={(e) => setPrescribedMedicines(e.target.value)}
                          placeholder="E.g. Paracetamol 500mg - 1 tablet 2 times a day"
                          className="bg-background border-emerald-900/20 min-h-[80px]"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAction(null);
                            setNotes(appointment.notes || "");
                            setPrescribedMedicines("");
                          }}
                          disabled={notesLoading || isGeneratingPrescription}
                          className="border-emerald-900/30"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSavePrescription}
                          disabled={notesLoading || isGeneratingPrescription || !!existingPrescription}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {notesLoading || isGeneratingPrescription ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Save & Generate PDF"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {existingPrescription && (
                        <Button 
                          className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 shadow-sm transition-all"
                          onClick={() => window.open(existingPrescription.pdfUrl, "_blank")}
                        >
                          <Stethoscope className="mr-2 w-4 h-4" />
                          View / Download Prescription
                        </Button>
                      )}
                      
                      <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20 min-h-[100px] max-h-[150px] overflow-y-auto custom-scrollbar flex-1">
                        {appointment.notes ? (
                          <p className="text-white whitespace-pre-line text-sm break-words">
                            {appointment.notes}
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic text-sm">
                            No notes added yet
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 shrink-0 pt-4 mt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Mark as Complete Button - Only for doctors */}
              {canMarkCompleted() && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={completeLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {/* Cancel Button - For scheduled appointments */}
              {appointment.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10 w-full sm:w-auto mt-2 sm:mt-0"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              onClick={() => setOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto mt-2 sm:mt-0"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hidden layout purely used for generating the PDF via html-to-image */}
      {action === "notes" && userRole === "DOCTOR" && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div id="prescription-render-target">
            <PrescriptionDocument 
              doctorName={`Dr. ${appointment.doctor?.name || "Unknown"}`}
              doctorSpecialty={appointment.doctor?.specialty || "General Medicine"}
              patientName={appointment.patient?.name || "Unknown"}
              date={appointment.startTime}
              patientDescription={appointment.patientDescription}
              clinicalNotes={notes}
              prescribedMedicines={prescribedMedicines}
            />
          </div>
        </div>
      )}
    </>
  );
}
