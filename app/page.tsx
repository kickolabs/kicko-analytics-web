import {
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  BriefcaseBusiness,
  GraduationCap,
  SearchCheck,
  FileCheck2,
  LockKeyhole,
  Building2,
  Users,
  CheckCircle2,
  ScanSearch,
  Globe2,
  Clock3,
} from "lucide-react";

const services = [
  {
    icon: Fingerprint,
    title: "Identity Verification",
    description:
      "Verify identity information and supporting documents through appropriate verification sources.",
    number: "01",
  },
  {
    icon: BriefcaseBusiness,
    title: "Employment Verification",
    description:
      "Review employment history, previous employers, designations and employment periods.",
    number: "02",
  },
  {
    icon: GraduationCap,
    title: "Education Verification",
    description:
      "Validate educational qualifications, degrees and academic credentials through supported processes.",
    number: "03",
  },
  {
    icon: SearchCheck,
    title: "Background Verification",
    description:
      "Manage address checks, reference checks and other supported background screening services.",
    number: "04",
  },
  {
    icon: FileCheck2,
    title: "Document Verification",
    description:
      "Review job offers, employment contracts and other important documents for inconsistencies.",
    number: "05",
  },
  {
    icon: Globe2,
    title: "Overseas Verification",
    description:
      "Help candidates and recruitment teams review overseas employment documents and related claims.",
    number: "06",
  },
];

const benefits = [
  {
    icon: ScanSearch,
    title: "Structured Verification",
    description:
      "Keep verification requests, supporting evidence and findings organised in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence-Based Reports",
    description:
      "Present verification results with clear statuses, supporting information and review notes.",
  },
  {
    icon: Clock3,
    title: "Track Every Request",
    description:
      "Follow each case from submission through review and final report delivery.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy-Focused Design",
    description:
      "Use controlled access to protect sensitive candidate information and verification reports.",
  },
];

const steps = [
  {
    number: "01",
    title: "Submit a Request",
    description:
      "Choose a verification service and provide the required candidate information.",
  },
  {
    number: "02",
    title: "Verification Begins",
    description:
      "Supporting information is reviewed through the available verification workflow.",
  },
  {
    number: "03",
    title: "Review the Findings",
    description:
      "Incomplete cases and discrepancies are examined before the report is finalised.",
  },
  {
    number: "04",
    title: "Receive Your Report",
    description:
      "Access the completed report through your account with its relevant findings and status.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <div className="text-lg font-extrabold tracking-tight">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.19em] text-slate-500">
                Verification Solutions
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#services"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              Services
            </a>
            <a
              href="#solutions"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              Solutions
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              How It Works
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              About Us
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-blue-700 sm:inline-flex"
            >
              Sign In
            </a>

            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-slate-50">
        <div className="pointer-events-none absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Smarter Verification. Better Decisions.
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Trust Every{" "}
              <span className="text-blue-700">Decision.</span>
              <br />
              Verify What{" "}
              <span className="text-blue-700">Matters.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Simplify identity checks, employment screening, education
              verification and document reviews with one organised platform
              built for businesses, recruiters and individuals.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Explore Our Services
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                How It Works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Clear verification statuses
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Structured digital reports
              </span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-3xl bg-blue-200/50 blur-2xl" />

            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/40 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Verification Overview
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Sample dashboard preview
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <ScanSearch className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Total Requests
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    128
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Sample data
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    In Progress
                  </p>
                  <p className="mt-3 text-3xl font-bold text-blue-700">
                    24
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Sample data
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Recent Verification Cases
                  </h3>
                  <span className="text-xs text-slate-400">Preview</span>
                </div>

                {[
                  {
                    name: "Identity Verification",
                    type: "Identity check",
                    status: "Completed",
                    color: "bg-emerald-50 text-emerald-700",
                  },
                  {
                    name: "Employment History",
                    type: "Employment check",
                    status: "In Progress",
                    color: "bg-blue-50 text-blue-700",
                  },
                  {
                    name: "Education Certificate",
                    type: "Education check",
                    status: "Under Review",
                    color: "bg-amber-50 text-amber-700",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 border-t border-slate-100 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FileCheck2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.type}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold sm:text-xs ${item.color}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-xs leading-5 text-blue-800">
                  Demonstration interface only. The displayed counts and cases
                  are sample data, not actual verification results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Strip */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 py-8 sm:px-8 lg:justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Built for
          </p>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Building2 className="h-5 w-5 text-blue-700" />
            Employers
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Users className="h-5 w-5 text-blue-700" />
            Recruitment Agencies
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <BriefcaseBusiness className="h-5 w-5 text-blue-700" />
            Small Businesses
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Fingerprint className="h-5 w-5 text-blue-700" />
            Individuals
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              Our Services
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              One Platform. Multiple Verification Needs.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Manage different verification requirements through one organised
              workflow, with case tracking and clear reporting.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.number}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-sm font-bold text-slate-300">
                      {service.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {service.description}
                  </p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition group-hover:gap-3"
                  >
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="bg-slate-950 py-24 text-white sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
              Why KICKO Analytics
            </p>

            <h2 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Designed for a Better Verification Experience
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-slate-300">
              Verification involves more than collecting documents. It
              requires an organised process, careful review, traceable findings
              and responsible handling of sensitive information.
            </p>

            <a
              href="#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-blue-50"
            >
              Discuss Your Requirements
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-400/40 hover:bg-white/[0.07]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 font-bold">{benefit.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-slate-50 py-24 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              Our Process
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              From Request to Report
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              A structured process designed to help customers follow
              verification cases from submission to completion.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-lg font-extrabold text-white shadow-lg shadow-blue-700/15">
                  {step.number}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Confidence Through Clear Verification
          </h2>

          <p className="mx-auto mt-6 max-w-3xl leading-8 text-slate-600">
            Our vision is to bring verification requests, reviews and reports
            into one accessible platform. Each result should communicate what
            was checked, what was found and where further confirmation is
            needed.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-blue-700 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to Simplify Verification?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
            Tell us about your verification requirements and the workflow your
            organisation needs.
          </p>

          <a
            href="mailto:contact@kickoanalytics.com"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
          >
            Contact Our Team
            <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-5 text-xs text-blue-200">
            Replace this demonstration contact address with your confirmed
            business email before launch.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-extrabold text-slate-900">
                KICKO ANALYTICS
              </p>

              <p className="text-xs text-slate-500">
                Verification Solutions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-500">
            <a href="#services" className="hover:text-blue-700">
              Services
            </a>
            <a href="#about" className="hover:text-blue-700">
              About
            </a>
            <a href="#contact" className="hover:text-blue-700">
              Contact
            </a>
            <a href="/privacy" className="hover:text-blue-700">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-blue-700">
              Terms
            </a>
          </div>

          <p className="text-xs text-slate-500">
            © 2026 KICKO Analytics. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}