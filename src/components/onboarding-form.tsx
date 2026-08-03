"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const INDUSTRIES = [
  "E-commerce",
  "Real estate",
  "Services",
  "Education",
  "Other",
] as const;

const FOCUS_AREAS = [
  "Drop-off rate",
  "Time on page",
  "Most-viewed pages",
  "Conversion rate",
  "Overall trend",
  "Not sure yet",
] as const;

const TEAM_SIZES = ["Just me", "2-10", "11-50", "50+"] as const;

const inputClassName =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500";

type OnboardingAnswers = {
  productName: string;
  industry: string;
  industryOther: string;
  focusAreas: string[];
  teamSize: string;
};

function resolveIndustry(industry: string, industryOther: string): string | null {
  if (!industry) {
    return null;
  }

  if (industry === "Other") {
    return industryOther.trim() || "Other";
  }

  return industry;
}

export function OnboardingForm() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryOther, setIndustryOther] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleFocusArea(area: string) {
    setFocusAreas((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  }

  async function saveProfile(answers: OnboardingAnswers) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: saveError } = await supabase.from("profiles").upsert({
      id: user.id,
      onboarding_completed: true,
      product_name: answers.productName.trim() || null,
      industry: resolveIndustry(answers.industry, answers.industryOther),
      focus_areas: answers.focusAreas.length > 0 ? answers.focusAreas : null,
      team_size: answers.teamSize || null,
      updated_at: new Date().toISOString(),
    });

    if (saveError) {
      setError(saveError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await saveProfile({
        productName,
        industry,
        industryOther,
        focusAreas,
        teamSize,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setIsSubmitting(true);

    try {
      await saveProfile({
        productName: "",
        industry: "",
        industryOther: "",
        focusAreas: [],
        teamSize: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome to Sensa
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tell us a bit about your product — all questions are optional.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleContinue} className="space-y-5">
          <div>
            <label
              htmlFor="product-name"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              What&apos;s your product or website called?
            </label>
            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              className={inputClassName}
              placeholder="Acme Marketplace"
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              What&apos;s your industry?
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className={inputClassName}
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {industry === "Other" && (
              <input
                type="text"
                value={industryOther}
                onChange={(event) => setIndustryOther(event.target.value)}
                className={`${inputClassName} mt-2`}
                placeholder="Describe your industry"
              />
            )}
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-zinc-700">
              What do you want to measure with this tool?
            </legend>
            <div className="space-y-2">
              {FOCUS_AREAS.map((area) => (
                <label
                  key={area}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={focusAreas.includes(area)}
                    onChange={() => toggleFocusArea(area)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  />
                  {area}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="team-size"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              What&apos;s your team size?
            </label>
            <select
              id="team-size"
              value={teamSize}
              onChange={(event) => setTeamSize(event.target.value)}
              className={inputClassName}
            >
              <option value="">Select team size</option>
              {TEAM_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
