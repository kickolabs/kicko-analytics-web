"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    FileCheck2,
    FileUp,
    Fingerprint,
    GraduationCap,
    Globe2,
    Info,
    ShieldCheck,
    Trash2,
    UserRound,
} from "lucide-react";

const verificationServices = [
    {
        value: "identity",
        label: "Identity Verification",
        description: "Review identity information and supporting documents.",
        icon: Fingerprint,
    },
    {
        value: "employment",
        label: "Employment Verification",
        description: "Review employment history, designation and tenure.",
        icon: BriefcaseBusiness,
    },
    {
        value: "education",
        label: "Education Verification",
        description: "Review degrees and educational qualifications.",
        icon: GraduationCap,
    },
    {
        value: "background",
        label: "Background Verification",
        description: "Request supported background screening checks.",
        icon: ShieldCheck,
    },
    {
        value: "overseas",
        label: "Overseas Document Verification",
        description: "Review overseas job offers and related documents.",
        icon: Globe2,
    },
    {
        value: "document",
        label: "Document Authenticity Review",
        description: "Review documents for inconsistencies and possible tampering.",
        icon: FileCheck2,
    },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
];

type SelectedDocument = {
    id: string;
    file: File;
};

export default function NewVerificationRequestPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [service, setService] = useState("identity");

    const [candidate, setCandidate] = useState({
        fullName: "",
        email: "",
        mobile: "",
        country: "India",
        referenceId: "",
        notes: "",
    });

    const [documents, setDocuments] = useState<SelectedDocument[]>([]);

    const [consent, setConsent] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [previewId, setPreviewId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    function updateCandidate(
        field: keyof typeof candidate,
        value: string,
    ) {
        setCandidate((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    function handleFileSelection(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        setError("");

        const selectedFiles = Array.from(event.target.files ?? []);

        for (const file of selectedFiles) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                setError(
                    `${file.name}: Only PDF, JPG and PNG files are accepted.`,
                );

                event.target.value = "";
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`${file.name}: The maximum file size is 10 MB.`);

                event.target.value = "";
                return;
            }
        }

        setDocuments((previous) => {
            const availableFiles = selectedFiles.filter(
                (file) =>
                    !previous.some(
                        (item) =>
                            item.file.name === file.name &&
                            item.file.size === file.size,
                    ),
            );

            return [
                ...previous,
                ...availableFiles.map((file) => ({
                    id: crypto.randomUUID(),
                    file,
                })),
            ];
        });

        event.target.value = "";
    }

    function removeDocument(id: string) {
        setDocuments((previous) =>
            previous.filter((document) => document.id !== id),
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (candidate.fullName.trim().length < 2) {
            setError("Please enter the candidate's full name.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{10}$/.test(candidate.mobile)) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!consent) {
            setError("Please confirm the required consent.");
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Check whether the customer is logged in.
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                window.location.assign("/auth/login");
                return;
            }

            // Save the request in the Supabase database.
            const { data, error: insertError } = await supabase
                .from("verification_requests")
                .insert({
                    created_by: user.id,
                    service_type: service,
                    candidate_full_name: candidate.fullName.trim(),
                    candidate_email: candidate.email.trim().toLowerCase(),
                    candidate_mobile: candidate.mobile,
                    candidate_country: candidate.country,
                    external_reference: candidate.referenceId.trim() || null,
                    notes: candidate.notes.trim() || null,
                    consent_confirmed: true,
                    consent_version: "v1",
                })
                .select("id, request_code")
                .single();

            if (insertError) {
                console.error("Supabase error:", insertError);

                setError(
                    "Unable to save your request. Please check the error in the terminal or browser console.",
                );

                return;
            }

            // Display the reference generated by the database.
            // Upload selected documents to private Supabase Storage.
            let uploadedCount = 0;
            const failedUploads: string[] = [];

            for (const document of documents) {
            const extension =
                document.file.type === "application/pdf"
                ? "pdf"
                : document.file.type === "image/jpeg"
                    ? "jpg"
                    : "png";

            // Store files under the authenticated user's ID and request ID.
            const storagePath =
                `${user.id}/${data.id}/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from("verification-documents")
                .upload(storagePath, document.file, {
                contentType: document.file.type,
                upsert: false,
                });

            if (uploadError) {
                console.error("Document upload failed:", uploadError);
                failedUploads.push(document.file.name);
                continue;
            }

            // Save the document details in the database.
            const { error: metadataError } = await supabase
                .from("verification_documents")
                .insert({
                request_id: data.id,
                uploaded_by: user.id,
                original_filename: document.file.name,
                storage_path: storagePath,
                mime_type: document.file.type,
                file_size_bytes: document.file.size,
                category: "supporting",
                });

            if (metadataError) {
                console.error("Document metadata could not be saved:", metadataError);
                failedUploads.push(document.file.name);
                continue;
            }

            uploadedCount++;
            }

            // Prepare the confirmation message.
            if (documents.length === 0) {
            setUploadMessage(
                "Your verification request was saved successfully. No documents were selected."
            );
            } else if (failedUploads.length === 0) {
            setUploadMessage(
                `${uploadedCount} document(s) uploaded and attached successfully.`
            );
            } else {
            setUploadMessage(
                `${uploadedCount} document(s) attached successfully. ${failedUploads.length} document(s) could not be attached. Please contact support before retrying.`
            );
            }

            // Show the request confirmation.
            setPreviewId(data.request_code);
            setSubmitted(true);
        } catch (error) {
            console.error("Submission error:", error);

            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-slate-50 px-5 py-12 sm:px-8">
                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <h1 className="mt-6 text-2xl font-extrabold text-slate-950">
                        Verification Request Submitted
                    </h1>

                    <p className="mt-3 leading-7 text-slate-600">
                        Your verification request has been saved successfully.
                        Keep the reference ID below to track your request.
                    </p>

                    <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Demonstration Reference
                        </p>

                        <p className="mt-2 break-all text-lg font-bold text-blue-700">
                            {previewId}
                        </p>

                        <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Candidate</span>
                                <span className="text-right font-semibold text-slate-900">
                                    {candidate.fullName}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Service</span>
                                <span className="text-right font-semibold text-slate-900">
                                    {
                                        verificationServices.find(
                                            (item) => item.value === service,
                                        )?.label
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Documents selected</span>
                                <span className="font-semibold text-slate-900">
                                    {documents.length}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Request status</span>
                                <span className="font-semibold text-emerald-700">
                                    Submitted
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                        {uploadMessage}
                    </div>

                    <div className="mt-7">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            Return to Dashboard
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
                            <ShieldCheck className="h-6 w-6" />
                        </div>

                        <div>
                            <p className="font-extrabold tracking-tight">
                                KICKO <span className="text-blue-700">ANALYTICS</span>
                            </p>

                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Verification Platform
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Dashboard
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
                <div>
                    <p className="text-sm font-bold text-blue-700">
                        Verification Management
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                        New Verification Request
                    </h1>

                    <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                        Select a service and provide the required information to prepare a
                        verification request.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-9 space-y-7">
                    {/* Service Selection */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold">
                                    1. Select Verification Service
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Choose the type of verification required.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {verificationServices.map((item) => {
                                const Icon = item.icon;
                                const selected = service === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setService(item.value)}
                                        aria-pressed={selected}
                                        className={`rounded-xl border p-4 text-left transition ${selected
                                            ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected
                                                    ? "bg-blue-700 text-white"
                                                    : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {item.label}
                                                </p>

                                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                                    {item.description}
                                                </p>
                                            </div>

                                            {selected && (
                                                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-700" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Candidate Information */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <UserRound className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold">
                                    2. Candidate Information
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Enter the candidate details required for this request.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="fullName"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Full Name <span className="text-red-600">*</span>
                                </label>

                                <input
                                    id="fullName"
                                    required
                                    minLength={2}
                                    maxLength={150}
                                    autoComplete="name"
                                    value={candidate.fullName}
                                    onChange={(event) =>
                                        updateCandidate("fullName", event.target.value)
                                    }
                                    placeholder="Enter the candidate's full name"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Email Address <span className="text-red-600">*</span>
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={candidate.email}
                                    onChange={(event) =>
                                        updateCandidate("email", event.target.value)
                                    }
                                    placeholder="candidate@example.com"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="mobile"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Mobile Number <span className="text-red-600">*</span>
                                </label>

                                <input
                                    id="mobile"
                                    type="tel"
                                    inputMode="numeric"
                                    required
                                    maxLength={10}
                                    minLength={10}
                                    value={candidate.mobile}
                                    onChange={(event) =>
                                        updateCandidate(
                                            "mobile",
                                            event.target.value.replace(/\D/g, "").slice(0, 10),
                                        )
                                    }
                                    placeholder="10-digit mobile number"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Enter a 10-digit Indian mobile number.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="country"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Country
                                </label>

                                <select
                                    id="country"
                                    value={candidate.country}
                                    onChange={(event) =>
                                        updateCandidate("country", event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                >
                                    <option value="India">India</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="United States">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Germany">Germany</option>
                                    <option value="United Arab Emirates">
                                        United Arab Emirates
                                    </option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="referenceId"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Reference ID <span className="text-slate-400">(Optional)</span>
                                </label>

                                <input
                                    id="referenceId"
                                    maxLength={100}
                                    value={candidate.referenceId}
                                    onChange={(event) =>
                                        updateCandidate("referenceId", event.target.value)
                                    }
                                    placeholder="Your internal candidate ID"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="notes"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Additional Information{" "}
                                    <span className="text-slate-400">(Optional)</span>
                                </label>

                                <textarea
                                    id="notes"
                                    rows={4}
                                    maxLength={1000}
                                    value={candidate.notes}
                                    onChange={(event) =>
                                        updateCandidate("notes", event.target.value)
                                    }
                                    placeholder="Enter relevant details about the requested verification."
                                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Document Upload */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <FileUp className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold">
                                    3. Supporting Documents
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Select the files relevant to the requested verification.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center sm:p-9">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <FileUp className="h-6 w-6" />
                            </div>

                            <p className="mt-4 text-sm font-bold text-slate-900">
                                Select documents from your device
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                PDF, JPG or PNG. Maximum 10 MB per file.
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                onChange={handleFileSelection}
                                className="sr-only"
                                aria-label="Select supporting documents"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
                            >
                                <FileUp className="h-4 w-4" />
                                Choose Files
                            </button>
                        </div>

                        {documents.length > 0 && (
                            <div className="mt-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Selected Documents ({documents.length})
                                </h3>

                                {documents.map((document) => (
                                    <div
                                        key={document.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <FileCheck2 className="h-5 w-5 shrink-0 text-blue-700" />

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {document.file.name}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {(document.file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeDocument(document.id)}
                                            aria-label={`Remove ${document.file.name}`}
                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                            <p className="text-xs leading-6 text-amber-900">
                                Prototype only: selected files remain in your browser memory.
                                They are not uploaded or saved. Do not use real identity
                                documents until secure storage and access controls are
                                implemented.
                            </p>
                        </div>
                    </section>

                    {/* Consent */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-lg font-bold">
                            4. Consent and Declaration
                        </h2>

                        <div className="mt-5 rounded-lg bg-slate-50 p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(event) => setConsent(event.target.checked)}
                                    className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
                                />

                                <span className="text-sm leading-7 text-slate-700">
                                    I confirm that I am authorised to submit this request, that
                                    the required candidate consent has been obtained where
                                    applicable, and that the information provided is accurate to
                                    the best of my knowledge.
                                    <span className="text-red-600"> *</span>
                                </span>
                            </label>
                        </div>
                    </section>

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Saving Request..." : "Submit Verification Request"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-xs leading-6 text-slate-500">
                    KICKO Analytics · Verification Management Platform
                </p>
            </div>
        </main>
    );
}