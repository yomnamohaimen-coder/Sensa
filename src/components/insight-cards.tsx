"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, FileText, Lightbulb, type LucideIcon } from "lucide-react";

/** Percentages, compact counts, and multipliers — figures that carry meaning in AI copy. */
const FIGURE_PATTERN =
  /\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|\d+(?:\.\d+)?%|\d+(?:\.\d+)?x\b/gi;

function emphasizeInsightFigures(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(FIGURE_PATTERN.source, FIGURE_PATTERN.flags);

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={`${match.index}-${match[0]}`} className="font-semibold text-ink">
        {match[0]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

type InsightKind = "summary" | "anomaly" | "recommendation";

const INSIGHT_META: Record<
  InsightKind,
  { Icon: LucideIcon; label: string; iconClassName: string; cardClassName: string }
> = {
  summary: {
    Icon: FileText,
    label: "Summary",
    iconClassName: "text-ink-faint",
    cardClassName: "border border-hairline bg-canvas",
  },
  anomaly: {
    Icon: AlertTriangle,
    label: "Anomaly",
    iconClassName: "text-[var(--warning)]",
    cardClassName:
      "border border-hairline border-l-4 border-l-[var(--warning)] bg-[var(--warning-wash)]",
  },
  recommendation: {
    Icon: Lightbulb,
    label: "Recommendation",
    iconClassName: "text-ink-faint",
    cardClassName: "border border-hairline bg-canvas",
  },
};

const STAGGER_MS = 120;

function InsightCard({
  kind,
  body,
  index,
  visible,
}: {
  kind: InsightKind;
  body: string;
  index: number;
  visible: boolean;
}) {
  const { Icon, label, iconClassName, cardClassName } = INSIGHT_META[kind];

  return (
    <div
      className={`rounded-md px-3 py-2.5 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${cardClassName} ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-1.5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
      style={{ transitionDelay: visible ? `${index * STAGGER_MS}ms` : "0ms" }}
    >
      <div className="flex gap-2.5">
        <Icon
          aria-hidden
          className={`mt-0.5 h-4 w-4 shrink-0 ${iconClassName}`}
          strokeWidth={1.75}
        />
        <p className="min-w-0 max-w-prose leading-6 text-ink-secondary">
          <span className="font-medium text-ink">{label}:</span>{" "}
          {emphasizeInsightFigures(body)}
        </p>
      </div>
    </div>
  );
}

export function InsightCards({
  summary,
  anomaly,
  recommendation,
}: {
  summary: string;
  anomaly: string | null;
  recommendation: string;
}) {
  const [visible, setVisible] = useState(false);

  // Reduced motion is handled by each card's `motion-reduce:` classes, which
  // render the final state immediately regardless of this flag.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const cards: { kind: InsightKind; body: string }[] = [
    { kind: "summary", body: summary },
    ...(anomaly ? [{ kind: "anomaly" as const, body: anomaly }] : []),
    { kind: "recommendation", body: recommendation },
  ];

  return (
    <div className="flex flex-col gap-3 text-sm">
      {cards.map((card, index) => (
        <InsightCard
          key={card.kind}
          kind={card.kind}
          body={card.body}
          index={index}
          visible={visible}
        />
      ))}
    </div>
  );
}
