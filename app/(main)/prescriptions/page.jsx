"use client";

import React, { useEffect, useState } from "react";
import { getPatientPrescriptions } from "@/actions/prescriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Calendar, Stethoscope, Download } from "lucide-react";
import { format } from "date-fns";
import { GsapReveal } from "@/components/gsap-reveal";
import { BorderBeam } from "@/components/ui/border-beam";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrescriptions() {
      try {
        const { prescriptions } = await getPatientPrescriptions();
        setPrescriptions(prescriptions || []);
      } catch (error) {
        console.error("Failed to fetch prescriptions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-muted-foreground animate-pulse">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 mt-6 md:mt-20 max-w-5xl">
      <GsapReveal>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-emerald-500/10 p-3 rounded-full shrink-0">
            <FileText className="h-7 w-7 md:h-8 md:w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Prescriptions</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 sm:mt-0">Access and download your official 247care prescriptions</p>
          </div>
        </div>
      </GsapReveal>

      {prescriptions.length === 0 ? (
        <GsapReveal delay={0.2}>
          <div className="text-center py-20 bg-muted/20 border border-border rounded-xl">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No Prescriptions Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't received any prescriptions from your doctors yet. After a doctor completes an appointment and writes a prescription, it will appear here.
            </p>
          </div>
        </GsapReveal>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.map((prescription, index) => (
            <GsapReveal key={prescription._id} delay={0.1 * index}>
              <div className="relative group rounded-xl h-full">
                {/* Magic UI Border Beam */}
                <BorderBeam
                  duration={8}
                  size={150}
                  colorFrom="#10b981"
                  colorTo="#059669"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                />
                <Card className="relative h-full overflow-hidden bg-[#0a0f0d]/80 backdrop-blur-xl border-emerald-900/30 group-hover:border-emerald-500/50 transition-all duration-500 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  {/* Subtle Top Gradient Line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-600/0 via-emerald-400/50 to-emerald-600/0 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Ambient internal glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardContent className="p-7 relative z-20 flex flex-col h-full justify-between gap-6">
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-[19px] tracking-tight text-white flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                              <Stethoscope className="h-4 w-4 text-emerald-400" />
                            </div>
                            Dr. {prescription.doctor?.name}
                          </h3>
                          <p className="text-[13px] uppercase tracking-wider font-medium text-emerald-400/70 mt-3 pl-11">
                            {prescription.doctor?.specialty}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#030706]/50 p-3.5 rounded-lg border border-white/[0.03] flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-emerald-400/80" />
                        <span className="text-[14px] text-white/80 font-medium">
                          {prescription.appointment?.startTime 
                            ? format(new Date(prescription.appointment.startTime), "MMM d, yyyy • h:mm a")
                            : format(new Date(prescription.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => window.open(prescription.pdfUrl, "_blank")}
                      className="w-full relative overflow-hidden bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all duration-300 group/btn mt-auto shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center font-medium tracking-wide">
                        <Download className="mr-2 h-[18px] w-[18px]" />
                        Download PDF
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </GsapReveal>
          ))}
        </div>
      )}
    </div>
  );
}
