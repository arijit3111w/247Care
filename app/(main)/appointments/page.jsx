import { getPatientAppointments } from "@/actions/patient";
import { AppointmentCard } from "@/components/appointment-card";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/onboarding";

export default async function PatientAppointmentsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/onboarding");
  }

  const { appointments, error } = await getPatientAppointments();

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 mt-4 md:mt-16">
      <PageHeader
        icon={<Calendar />}
        title="My Appointments"
        backLink="/doctors"
        backLabel="Find Doctors"
      />

      <div className="mt-6 md:mt-10 overflow-hidden border border-[#1a1a1a] bg-[#030303] shadow-[0_0_40px_rgba(16,185,129,0.05)] rounded-sm group relative">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500/50" />
          </div>
          <div className="text-[#666] font-mono text-[11px] tracking-wider uppercase">
            ~ / user / appointments
          </div>
          <div className="w-[42px]" /> {/* Spacer to center the title */}
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-emerald-500 font-mono text-sm">➜</span>
            <span className="text-[#888] font-mono text-sm">~</span>
            <span className="text-emerald-400 font-mono text-sm font-bold ml-1">./view_schedule</span>
          </div>

          {error ? (
            <div className="p-4 border border-red-900/30 bg-red-900/10 text-red-400 font-mono text-sm rounded-sm">
              [ERROR]: {error}
            </div>
          ) : appointments?.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="PATIENT"
                />
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[#222] bg-[#080808]">
              <div className="text-[#333] mb-4">
                <Calendar className="h-12 w-12" strokeWidth={1} />
              </div>
              <p className="font-mono text-[#666] text-sm">
                No active processes found.
              </p>
              <p className="font-mono text-[#444] text-[11px] mt-2">
                Type `find doctors` to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
