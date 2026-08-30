import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  InboxAuditApplyResult,
  InboxAuditItem,
  InboxContainer,
  InboxVerdict,
  WeeklyInboxAudit,
} from "@shared/schema";
import {
  AlertTriangle,
  ExternalLink,
  FolderPlus,
  Link2,
  Loader2,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function VerdictBadge({ verdict }: { verdict: InboxVerdict }) {
  const styles =
    verdict === "assign"
      ? "text-primary bg-primary/10"
      : verdict === "remove"
        ? "text-destructive bg-destructive/10"
        : "text-chart-3 bg-chart-3/10";
  const label = verdict === "assign" ? "Assign" : verdict === "remove" ? "Remove" : "Recalibrate";
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${styles}`}>{label}</span>
  );
}

function AuditRow({
  item,
  containers,
  testId,
}: {
  item: InboxAuditItem;
  containers: InboxContainer[];
  testId: string;
}) {
  const [projectId, setProjectId] = useState(item.match?.id || "");
  const [newName, setNewName] = useState(item.proposedContainer?.name || "");
  const [newKind, setNewKind] = useState<"project" | "goal">(
    item.proposedContainer?.kind || "project",
  );
  const [done, setDone] = useState<InboxAuditApplyResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (verdict: InboxVerdict) => {
      const payload: Record<string, unknown> = { id: item.id, verdict };
      if (verdict === "assign") {
        if (projectId) payload.projectId = projectId;
      }
      if (verdict === "recalibrate") {
        payload.createContainer = { name: newName.trim(), kind: newKind };
      }
      const res = await apiRequest("POST", "/api/inbox-audit/apply", payload);
      return (await res.json()) as InboxAuditApplyResult;
    },
    onSuccess: (data) => {
      setDone(data);
      queryClient.invalidateQueries({ queryKey: ["/api/inbox-audit"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resurface"] });
    },
  });

  if (done) {
    return (
      <li className="px-5 py-3 border-b border-card-border last:border-b-0" data-testid={`${testId}-done`}>
        <p className="text-[12px] text-muted-foreground">{done.message}</p>
      </li>
    );
  }

  return (
    <li
      className="px-5 py-3 border-b border-card-border last:border-b-0 space-y-2"
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium block truncate">{item.name}</span>
          <span className="text-[11px] text-muted-foreground">{item.reason}</span>
          {item.due ? (
            <span className="text-[11px] text-muted-foreground block">
              Date {item.due.slice(0, 10)} · still Inbox
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VerdictBadge verdict={item.verdict} />
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Open ${item.name} in Notion`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      {item.verdict === "assign" || containers.length > 0 ? (
        <label className="block">
          <span className="sr-only">Assign to container</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full text-[12px] bg-muted/40 border border-card-border rounded-md px-2 py-1.5"
            data-testid={`${testId}-container`}
          >
            <option value="">Choose an existing project, goal, or reason</option>
            {containers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.kind})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {item.verdict === "recalibrate" || item.proposedContainer ? (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project or goal name"
            className="flex-1 text-[12px] bg-muted/40 border border-card-border rounded-md px-2 py-1.5"
            data-testid={`${testId}-new-name`}
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as "project" | "goal")}
            className="text-[12px] bg-muted/40 border border-card-border rounded-md px-2 py-1.5"
            data-testid={`${testId}-new-kind`}
          >
            <option value="project">Project</option>
            <option value="goal">Goal</option>
          </select>
        </div>
      ) : null}

      {mutation.isError ? (
        <p className="text-[12px] text-destructive">Couldn’t apply. Nothing was written unless you confirm again.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate("assign")}
          disabled={mutation.isPending}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border hover:bg-muted flex items-center gap-1"
          data-testid={`${testId}-assign`}
        >
          {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
          Confirm assign
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate("remove")}
          disabled={mutation.isPending}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center gap-1"
          data-testid={`${testId}-remove`}
        >
          <Trash2 className="w-3 h-3" />
          Confirm remove
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate("recalibrate")}
          disabled={mutation.isPending}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border hover:bg-muted flex items-center gap-1"
          data-testid={`${testId}-recalibrate`}
        >
          <FolderPlus className="w-3 h-3" />
          Confirm recalibrate
        </button>
      </div>
    </li>
  );
}

export function InboxAuditSection() {
  const { data, isLoading, error } = useQuery<WeeklyInboxAudit>({
    queryKey: ["/api/inbox-audit"],
    staleTime: 900000,
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-5 mb-6 animate-fade-in delay-2">
        <Skeleton className="h-5 w-56 mb-3" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="bg-card border border-card-border rounded-xl px-5 py-4 mb-6 animate-fade-in delay-2"
        data-testid="inbox-audit-error"
      >
        <p className="text-[13px] text-muted-foreground">
          Couldn’t load the weekly inbox audit. Daily resurface below is unchanged.
        </p>
      </div>
    );
  }

  const empty = data.stats.uncontained === 0;

  return (
    <div
      className="bg-card border border-card-border rounded-xl overflow-hidden mb-6 animate-fade-in delay-2"
      data-testid="inbox-audit-section"
    >
      <div className="px-5 py-3.5 border-b border-card-border">
        <div className="flex items-center gap-2 mb-1">
          {empty ? (
            <ScanSearch className="w-4 h-4 text-primary" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-chart-3" />
          )}
          <span className="font-display text-sm font-semibold" data-testid="inbox-audit-headline">
            {data.headline}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed" data-testid="inbox-audit-summary">
          {data.summary}
        </p>
        <p className="text-[11px] text-muted-foreground mt-2">
          Assign {data.stats.assign} · Remove {data.stats.remove} · Recalibrate {data.stats.recalibrate}.
          Nothing writes until you confirm.
        </p>
      </div>

      {empty ? (
        <p className="px-5 py-6 text-sm text-muted-foreground text-center">Inbox is contained.</p>
      ) : (
        <>
          <div className="px-5 py-2.5 border-b border-card-border flex items-center gap-2">
            <ScanSearch className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              New this week ({data.newItems.length})
            </span>
          </div>
          {data.newItems.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">No new uncontained tasks this week.</p>
          ) : (
            <ul data-testid="inbox-audit-new-list">
              {data.newItems.map((item, i) => (
                <AuditRow
                  key={item.id}
                  item={item}
                  containers={data.containers}
                  testId={`inbox-audit-new-${i}`}
                />
              ))}
            </ul>
          )}

          <div className="px-5 py-2.5 border-y border-card-border flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-chart-3" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-chart-3">
              Leftover ({data.leftoverItems.length})
            </span>
          </div>
          {data.leftoverItems.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">No leftover uncontained tasks.</p>
          ) : (
            <ul data-testid="inbox-audit-leftover-list">
              {data.leftoverItems.map((item, i) => (
                <AuditRow
                  key={item.id}
                  item={item}
                  containers={data.containers}
                  testId={`inbox-audit-leftover-${i}`}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
