// Cohort Insights → Departments. Two-pane deep-dive: sortable left rail
// with multi-select up to 4, right pane detail view or comparison grid.
// URL is the source of truth so deep links restore state.
import { useMemo, useCallback } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { PageHeader, GlassCard, EmptyState } from "@/components/college/primitives";
import { DepartmentRail, MAX_COMPARE } from "@/components/cohort/DepartmentRail";
import { DepartmentDetail } from "@/components/cohort/DepartmentDetail";
import { ComparisonGrid } from "@/components/cohort/ComparisonGrid";
import {
  compareDepartments,
  getDepartment,
  topMovers,
  K_MIN,
} from "@/lib/cohort-selectors";
import type { YearBand, RiskBand } from "@/lib/dashboard-mock.departments";

const YEAR_VALUES = ["All", "Y1", "Y2", "Y3", "Y4", "PG"] as const;
const RISK_VALUES = ["minimal", "mild", "moderate", "severe"] as const;
const RANGE_VALUES = ["12w", "26w", "52w"] as const;

const searchSchema = z.object({
  dept: z.string().optional(),                   // csv of ids
  year: z.enum(YEAR_VALUES).optional(),
  range: z.enum(RANGE_VALUES).optional(),
  risk: z.enum(RISK_VALUES).optional(),
});
type DeptSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({ meta: [{ title: "Departments — PeaceCode for Colleges" }] }),
  validateSearch: (raw): DeptSearch => {
    const parsed = searchSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  },
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const search = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });

  const selected = useMemo<string[]>(
    () => (search.dept ? search.dept.split(",").filter(Boolean).slice(0, MAX_COMPARE) : []),
    [search.dept],
  );
  const year: YearBand = (search.year as YearBand) ?? "All";
  const risk = (search.risk as RiskBand | undefined) ?? null;

  const patch = useCallback(
    (next: Partial<DeptSearch>) => {
      nav({
        search: (prev: DeptSearch) => {
          const merged: DeptSearch = { ...prev, ...next };
          (Object.keys(merged) as (keyof DeptSearch)[]).forEach((k) => {
            const v = merged[k];
            if (v === undefined || v === "" || v === null) delete merged[k];
          });
          return merged;
        },
      });
    },
    [nav],
  );

  const setSelected = useCallback(
    (ids: string[]) => {
      const capped = ids.slice(0, MAX_COMPARE);
      patch({ dept: capped.length ? capped.join(",") : undefined });
    },
    [patch],
  );

  const toggleDept = useCallback(
    (id: string) => {
      const has = selected.includes(id);
      setSelected(has ? selected.filter((x: string) => x !== id) : [...selected, id]);
    },
    [selected, setSelected],
  );
  const selectOnly = useCallback((id: string) => setSelected([id]), [setSelected]);

  const depts = compareDepartments(selected);
  const primary = selected[0] ? getDepartment(selected[0]) : null;

  return (
    <>
      <Breadcrumb />
      <PageHeader
        eyebrow="Cohort insights"
        title="Departments"
        subtitle="A department-by-department view of engagement, screening outcomes, and risk. Slices smaller than the anonymity floor are suppressed automatically — no exceptions."
        actions={
          selected.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="inline-flex items-center gap-1.5 text-[11.5px] px-3 py-1.5 rounded-full outline-none focus-visible:ring-2"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
                color: "var(--pc-ink-2)",
                // @ts-expect-error focus ring var
                "--tw-ring-color": "var(--pc-accent)",
              }}
            >
              <X aria-hidden className="h-3.5 w-3.5" /> Clear selection
            </button>
          ) : null
        }
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <DepartmentRail
          selected={selected}
          onToggle={toggleDept}
          onSelectOnly={selectOnly}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {selected.length === 0 && (
            <EmptyStateCard
              onTopMovers={() => setSelected(topMovers(3).map((d) => d.id))}
            />
          )}

          {selected.length >= 2 && <ComparisonGrid depts={depts} />}

          {primary && selected.length < 2 && (
            <DepartmentDetail
              dept={primary}
              year={year}
              onYearChange={(y) => patch({ year: y === "All" ? undefined : y })}
              riskFilter={risk}
              onRiskFilter={(b) => patch({ risk: b ?? undefined })}
            />
          )}

          {selected.length >= 2 && primary && (
            <DepartmentDetail
              dept={primary}
              year={year}
              onYearChange={(y) => patch({ year: y === "All" ? undefined : y })}
              riskFilter={risk}
              onRiskFilter={(b) => patch({ risk: b ?? undefined })}
            />
          )}
        </div>
      </div>
    </>
  );
}

function Breadcrumb() {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2 flex items-center gap-1 text-[10.5px] uppercase"
      style={{ color: "var(--pc-muted)", letterSpacing: "0.14em", fontFamily: "var(--font-serif)" }}
    >
      <Link to="/dashboard" className="hover:underline" style={{ color: "var(--pc-muted)" }}>
        Cohort insights
      </Link>
      <ChevronRight aria-hidden className="h-3 w-3" />
      <span style={{ color: "var(--pc-ink-2)" }}>Departments</span>
    </nav>
  );
}

function EmptyStateCard({ onTopMovers }: { onTopMovers: () => void }) {
  return (
    <GlassCard className="p-6 md:p-8">
      <EmptyState
        illustration="chart"
        title="Pick a department to begin"
        description={`Choose one department from the rail, or add up to ${MAX_COMPARE} for side-by-side comparison. Cohorts smaller than ${K_MIN} students are hidden.`}
        action={
          <button
            type="button"
            onClick={onTopMovers}
            className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full outline-none focus-visible:ring-2 transition-colors"
            style={{
              background: "var(--pc-accent)",
              color: "var(--pc-on-accent, #fff)",
              // @ts-expect-error focus ring var
              "--tw-ring-color": "var(--pc-accent)",
            }}
          >
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            Show top movers this week
          </button>
        }
      />
    </GlassCard>
  );
}
