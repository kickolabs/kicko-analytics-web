"use client";

import QRCode from "qrcode";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { FileDown, FileCheck2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type ReportRequest = {
  id: string;
  request_code: string;
  candidate_full_name: string;
  candidate_email: string;
  candidate_mobile: string;
  candidate_country: string;
  service_type: string;
  status: string;
};

type ReportReview = {
  check_category: string;
  outcome: string;
  findings: string;
  created_at: string;
};

type GenerateReportButtonProps = {
  request: ReportRequest;
  reviews: ReportReview[];
};

const serviceNames: Record<string, string> = {
  identity: "Identity Verification",
  employment: "Employment Verification",
  education: "Education Verification",
  background: "Background Verification",
  overseas: "Overseas Document Verification",
  document: "Document Authenticity Review",
  other: "Other Verification",
};

const outcomeNames: Record<string, string> = {
  verified: "Verified",
  discrepancy_found: "Discrepancy Found",
  unable_to_verify: "Unable to Verify",
  needs_information: "Needs More Information",
  not_checked: "Not Checked",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function GenerateReportButton({
  request,
  reviews,
}: GenerateReportButtonProps) {
  const router = useRouter();

  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [reportCode, setReportCode] = useState("");

  async function generateReport() {
    setMessage("");
    setIsError(false);
    setDownloadUrl("");
    setReportCode("");

    if (request.status !== "completed") {
      setIsError(true);
      setMessage(
        "A report can only be generated after the case is completed.",
      );
      return;
    }

    const activeReviews = reviews.filter(
      (review) => review.findings.trim().length > 0,
    );

    if (activeReviews.length === 0) {
      setIsError(true);
      setMessage(
        "Record at least one review finding before generating the report.",
      );
      return;
    }

    setGenerating(true);

    try {
      const supabase = createClient();

      // Verify the authenticated user.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setIsError(true);
        setMessage("Your session has expired. Please sign in again.");
        return;
      }

      // Create a unique report reference.
      const generatedCode =
        "KKA-RPT-" +
        crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

      const storagePath =
        `${request.id}/${generatedCode}.pdf`;

      const issuedAt = new Date().toISOString();

      // Generate a separate, unpredictable public validation token.
      const validationToken = crypto.randomUUID();

      const generatedValidationUrl =
        `${window.location.origin}/verify-report/${validationToken}`;

      // Generate the QR code image for the public validation page.
      const qrDataUrl = await QRCode.toDataURL(
        generatedValidationUrl,
        {
          errorCorrectionLevel: "M",
          margin: 3,
          width: 256,
        },
      );

      // Build the PDF document in the browser.
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;

      let y = 22;

      function addHeading(text: string) {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(text, margin, y);
        y += 8;
      }

      function addTextBlock(label: string, value: string) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);

        const labelLines = pdf.splitTextToSize(
          label,
          contentWidth,
        );

        if (y + labelLines.length * 5 + 12 > pageHeight - 18) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(labelLines, margin, y);
        y += labelLines.length * 5;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        const valueLines = pdf.splitTextToSize(
          value || "Not provided",
          contentWidth,
        );

        if (y + valueLines.length * 5 + 6 > pageHeight - 18) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(valueLines, margin, y);
        y += valueLines.length * 5 + 5;
      }

      // Report header.
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("KICKO ANALYTICS", margin, y);
      y += 9;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Verification Report", margin, y);
      y += 8;

      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);

      y += 10;

      addTextBlock("Report Reference", generatedCode);
      addTextBlock("Request Reference", request.request_code);
      addTextBlock("Report Issued", formatDate(issuedAt));

      addHeading("Candidate Information");

      addTextBlock(
        "Candidate Name",
        request.candidate_full_name,
      );

      addTextBlock(
        "Email Address",
        request.candidate_email,
      );

      addTextBlock(
        "Mobile Number",
        request.candidate_mobile,
      );

      addTextBlock(
        "Country",
        request.candidate_country,
      );

      addHeading("Verification Details");

      addTextBlock(
        "Verification Service",
        serviceNames[request.service_type] ??
          request.service_type,
      );

      addTextBlock("Case Status", "Completed");

      addHeading("Review Findings");

      activeReviews.forEach((review, index) => {
        const category =
          serviceNames[review.check_category] ??
          review.check_category;

        const outcome =
          outcomeNames[review.outcome] ??
          review.outcome;

        addTextBlock(
          `Review ${index + 1}: ${category}`,
          `Outcome: ${outcome}\nReviewed on: ${formatDate(review.created_at)}\n\nFindings:\n${review.findings}`,
        );
      });

      if (y > pageHeight - 35) {
        pdf.addPage();
        y = 20;
      }

      y += 5;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);

      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      const disclaimer =
        "This report reflects the verification findings recorded in KICKO Analytics at the time of issue. Findings should be interpreted according to the checks performed and the evidence available. This report does not guarantee any fact beyond the documented findings.";

      const reportDisclaimerLines = pdf.splitTextToSize(
      disclaimer,
      contentWidth,
    );

    pdf.text(reportDisclaimerLines, margin, y);
      
      // Add a dedicated report-authenticity page.
      pdf.addPage();

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("REPORT AUTHENTICITY CHECK", margin, 25);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const qrInstructions =
        "Scan this QR code to check the report's current validity status. " +
        "This public verification page does not disclose candidate information.";

      const instructionLines = pdf.splitTextToSize(
        qrInstructions,
        contentWidth,
      );

      pdf.text(instructionLines, margin, 37);

      // Embed the QR code as a PNG image.
      pdf.addImage(
        qrDataUrl,
        "PNG",
        margin,
        49,
        45,
        45,
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Report Reference", margin + 55, 57);

      pdf.setFont("helvetica", "normal");
      pdf.text(generatedCode, margin + 55, 64);

      pdf.setFont("helvetica", "bold");
      pdf.text("Issued", margin + 55, 73);

      pdf.setFont("helvetica", "normal");
      pdf.text(formatDate(issuedAt), margin + 55, 80);

      pdf.setFont("helvetica", "bold");
      pdf.text("Validation URL", margin, 108);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      const validationUrlLines = pdf.splitTextToSize(
        generatedValidationUrl,
        contentWidth,
      );

      pdf.text(validationUrlLines, margin, 115);

      pdf.setFontSize(9);

      const validationDisclaimer =
        "This page confirms the report's recorded issuance status. " +
        "It does not independently certify the truth of the underlying findings.";

      const disclaimerLines = pdf.splitTextToSize(
        validationDisclaimer,
        contentWidth,
      );

      pdf.text(
        disclaimerLines,
        margin,
        145,
      );

      const pdfBlob = pdf.output("blob");

      // Create the database record before uploading.
      // The private Storage upload policy requires this record.
      const { error: recordError } = await supabase
        .from("verification_reports")
        .insert({
          request_id: request.id,
          report_code: generatedCode,
          generated_by: user.id,
          storage_path: storagePath,
          validation_token: validationToken,
        });

      if (recordError) {
        console.error(
          "Report database insertion failed:",
          recordError,
        );

        setIsError(true);
        setMessage(
          `Could not create the report record: ${recordError.message}`,
        );

        return;
      }

      // Upload the PDF to the private Supabase bucket.
      const { error: uploadError } = await supabase.storage
        .from("verification-reports")
        .upload(storagePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("PDF upload failed:", uploadError);

        setIsError(true);
        setMessage(
          `The report record was created, but PDF storage failed: ${uploadError.message}. Do not generate another report for this case yet.`,
        );

        return;
      }

      // Generate a temporary download link.
      const { data: signedData, error: signedUrlError } =
        await supabase.storage
          .from("verification-reports")
          .createSignedUrl(storagePath, 300);

      setReportCode(generatedCode);

      if (signedUrlError || !signedData?.signedUrl) {
        setIsError(false);
        setMessage(
          "The report was generated and stored, but a download link could not be created. Refresh the case page and try accessing the report again.",
        );

        router.refresh();
        return;
      }

      setDownloadUrl(signedData.signedUrl);
      setMessage(
        "PDF report generated and saved securely in Supabase.",
      );

      router.refresh();
    } catch (error) {
      console.error("Report generation error:", error);

      setIsError(true);
      setMessage(
        "An unexpected error occurred while generating the report. Check the terminal for details.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <FileCheck2 className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-bold text-slate-900">
            Verification Report
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Generate a PDF report from this completed case and its
            recorded review findings.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={generateReport}
        disabled={generating}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FileDown className="h-4 w-4" />

        {generating
          ? "Generating Report..."
          : "Generate PDF Report"}
      </button>

      {message && (
        <div
          role="status"
          className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${
            isError
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {message}
        </div>
      )}

      {reportCode && (
        <p className="mt-4 break-all text-sm text-slate-600">
          Report Reference:{" "}
          <span className="font-bold text-blue-700">
            {reportCode}
          </span>
        </p>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          <FileDown className="h-4 w-4" />
          Open / Download PDF
        </a>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Reports contain confidential candidate information. Share them
        only with authorised recipients. Download links expire after
        five minutes.
      </p>
    </div>
  );
}