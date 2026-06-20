"use client";

import React from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Stethoscope } from "lucide-react";

export function PrescriptionDocument({
  doctorName,
  doctorSpecialty,
  patientName,
  date,
  patientDescription,
  clinicalNotes,
  prescribedMedicines,
}) {
  return (
    <div className="w-[800px] min-h-[1100px] bg-white text-black p-12 font-sans mx-auto relative overflow-hidden flex flex-col shadow-2xl">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
        <img src="/247care-logo.png" alt="watermark" className="w-[500px] h-[500px] object-contain grayscale" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start border-b-[3px] border-emerald-600 pb-6 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <img src="/247care-logo.png" alt="247care" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-3xl font-black text-emerald-800 tracking-tight">247care</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Digital Healthcare</p>
            <p className="text-xs text-gray-400 mt-1">contact@247care.com | 1-800-247-CARE</p>
          </div>
        </div>
        <div className="text-right max-w-xs">
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">{doctorName}</h2>
          <p className="text-emerald-700 font-bold text-sm mt-1">{doctorSpecialty}</p>
          <p className="text-gray-500 text-xs mt-1">Reg. No: 247C-{Math.floor(Math.random() * 9000) + 1000}</p>
        </div>
      </div>

      {/* Patient Info Bar */}
      <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-xl mb-8 flex justify-between items-center relative z-10">
        <div>
          <p className="text-[10px] text-emerald-800 uppercase font-black tracking-widest mb-1 opacity-70">Patient Name</p>
          <p className="text-lg font-bold text-gray-900">{patientName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-emerald-800 uppercase font-black tracking-widest mb-1 opacity-70">Consultation Date</p>
          <p className="text-base font-bold text-gray-900">{format(new Date(date), "dd MMM yyyy, hh:mm a")}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-8 relative z-10 flex-1">
        
        {/* Left Column - Diagnostics (1/3 width) */}
        <div className="w-[30%] border-r border-gray-200 pr-6 space-y-8">
          {patientDescription && (
            <div>
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-2 mb-3">
                Symptoms
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{patientDescription}</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-2 mb-3">
              Diagnosis
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{clinicalNotes || "Consultation for general checkup."}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-2 mb-3">
              General Advice
            </h3>
            <ul className="text-sm text-gray-700 space-y-2 list-none pl-1">
              <li className="flex items-start"><span className="text-emerald-500 mr-2">•</span> Take medicines as prescribed</li>
              <li className="flex items-start"><span className="text-emerald-500 mr-2">•</span> Stay hydrated</li>
              <li className="flex items-start"><span className="text-emerald-500 mr-2">•</span> Follow-up if symptoms persist</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Prescription (2/3 width) */}
        <div className="w-[70%] pl-2">
          <div className="mb-6 flex items-center">
            <span className="text-5xl font-serif font-black text-emerald-700 mr-4 leading-none">Rx</span>
            <div className="h-[2px] bg-emerald-50 flex-1 rounded-full"></div>
          </div>
          
          <div className="text-[15px] text-gray-800 whitespace-pre-wrap leading-loose font-medium">
            {prescribedMedicines ? (
              <div>{prescribedMedicines}</div>
            ) : (
              <p className="text-gray-400 italic">No medicines prescribed.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Signature */}
      <div className="mt-12 pt-6 border-t-[2px] border-emerald-50 flex justify-between items-end relative z-10">
        <div className="space-y-1.5">
          <p className="text-emerald-800 text-[10px] uppercase tracking-widest font-bold">Important Notes</p>
          <p className="text-gray-500 text-[10px] leading-relaxed">
            1. This is a digitally generated prescription on 247care platform.<br/>
            2. Valid only for the patient named above.<br/>
            3. Not valid for medico-legal purposes.
          </p>
        </div>
        <div className="text-center">
          <div className="w-56 h-14 flex items-center justify-center mb-1">
            <span className="text-emerald-800/30 text-3xl font-bold italic" style={{ fontFamily: "cursive, 'Brush Script MT', serif" }}>
              {doctorName.replace(/Dr\.?\s*/i, '')}
            </span>
          </div>
          <div className="border-t-[2px] border-emerald-600 w-64 pt-2">
            <p className="text-gray-900 font-black text-sm uppercase tracking-wide">{doctorName}</p>
            <p className="text-gray-500 text-[11px] font-semibold mt-0.5">{doctorSpecialty}</p>
          </div>
        </div>
      </div>
      
      {/* Bottom Color Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 to-teal-500 z-10"></div>
    </div>
  );
}

export const generatePrescriptionPDF = async (elementId, filename = "Prescription.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    // html-to-image relies on the browser's native rendering engine instead of a custom CSS parser,
    // which completely bypasses the 'oklch' CSS parser crash that html2canvas suffers from.
    const imgData = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
    });
    
    // A4 size: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // Create a temporary image to get dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => (img.onload = resolve));
    
    const pdfHeight = (img.height * pdfWidth) / img.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    // Create a Blob from the PDF to upload
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};
