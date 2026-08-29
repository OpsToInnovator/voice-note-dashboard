import type { GoalCoaching, NoteLevel } from "@shared/goalCoach";
import { verdictTag } from "@shared/goalCoach";

function NoteTone({ level }: { level: NoteLevel }) {
  const cls =
    level === "stop"
      ? "text-destructive"
      : level === "warn"
        ? "text-chart-3"
        : "text-muted-foreground";
  return <span className={`text-[10px] font-semibold uppercase tracking-wider ${cls}`}>{verdictTag(level) || level}</span>;
}

export function CoachPanel({ coach }: { coach: GoalCoaching | null | undefined }) {
  if (!coach) return null;
  const verdict = coach.feasibility?.verdict;

  return (
    <div className="bg-card border border-card-border rounded-xl px-5 py-4 space-y-4" data-testid="coach-panel">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Goal coach
        </p>
        <p className="text-[13px] font-medium" data-testid="coach-type">
          {coach.typeLabel}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{coach.blurb}</p>
      </div>

      {coach.outcomeNotes.length > 0 ? (
        <ul className="space-y-1" data-testid="coach-outcome-notes">
          {coach.outcomeNotes.map((note) => (
            <li key={note.text} className="text-[12px] leading-relaxed">
              <NoteTone level={note.level} />{" "}
              <span className="text-muted-foreground">{note.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {verdict ? (
        <div
          className={`rounded-lg border px-3 py-2.5 ${
            verdict.level === "stop"
              ? "border-destructive/40 bg-destructive/10"
              : verdict.level === "warn"
                ? "border-chart-3/40 bg-chart-3/10"
                : "border-card-border bg-muted/40"
          }`}
          data-testid="coach-verdict"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1">
            {verdictTag(verdict.level)}
          </p>
          <p className="text-[13px] leading-relaxed">{verdict.text}</p>
        </div>
      ) : null}

      {coach.feasibility?.rows.length ? (
        <dl className="space-y-1.5" data-testid="coach-math-rows">
          {coach.feasibility.rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 text-[12px]">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium text-right">
                {row.value}
                {row.note ? <span className="block text-[11px] font-normal text-muted-foreground">{row.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {coach.obstacles.length > 0 ? (
        <div data-testid="coach-obstacles">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            If–then
          </p>
          <ul className="space-y-2">
            {coach.obstacles.map((obs) => (
              <li key={obs.key} className="text-[12px] leading-relaxed">
                <span className="font-medium">{obs.label}.</span>{" "}
                <span className="text-muted-foreground">
                  If {obs.trigger}, then I will {obs.plan}.
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {coach.phases.length > 0 ? (
        <div data-testid="coach-phases">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Phases
          </p>
          <ol className="space-y-1.5 list-decimal list-inside">
            {coach.phases.map((phase) => (
              <li key={phase.name} className="text-[12px] leading-relaxed">
                <span className="font-medium">{phase.name}.</span>{" "}
                <span className="text-muted-foreground">{phase.focus}. Done when: {phase.done}.</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
