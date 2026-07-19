// Hand-maintained manifest of user-facing routes for the QA coverage panel.
// Update when adding a new route.

export type RouteManifestEntry = {
  path: string; // URL path
  file: string; // src/routes/... filename
  title: string;
  requiresAuth: boolean;
  hasLoader: boolean;
};

export const ROUTE_MANIFEST: RouteManifestEntry[] = [
  { path: "/", file: "src/routes/index.tsx", title: "Landing (redirect)", requiresAuth: false, hasLoader: false },
  { path: "/auth", file: "src/routes/auth.tsx", title: "Sign in", requiresAuth: false, hasLoader: false },

  { path: "/dashboard", file: "src/routes/_authenticated/dashboard.tsx", title: "Executive overview", requiresAuth: true, hasLoader: false },
  { path: "/departments", file: "src/routes/_authenticated.departments.tsx", title: "Departments", requiresAuth: true, hasLoader: false },

  { path: "/cohorts/year", file: "src/routes/_authenticated.cohorts.year.tsx", title: "Year & program", requiresAuth: true, hasLoader: false },
  { path: "/cohorts/demographics", file: "src/routes/_authenticated.cohorts.demographics.tsx", title: "Demographics", requiresAuth: true, hasLoader: false },
  { path: "/cohorts/compare", file: "src/routes/_authenticated.cohorts.compare.tsx", title: "Compare cohorts", requiresAuth: true, hasLoader: false },

  { path: "/signals/wellbeing", file: "src/routes/_authenticated.signals.wellbeing.tsx", title: "Wellbeing signals", requiresAuth: true, hasLoader: false },
  { path: "/signals/mood", file: "src/routes/_authenticated.signals.mood.tsx", title: "Mood trends", requiresAuth: true, hasLoader: false },
  { path: "/signals/screenings", file: "src/routes/_authenticated.signals.screenings.tsx", title: "Screening outcomes", requiresAuth: true, hasLoader: false },
  { path: "/signals/engagement", file: "src/routes/_authenticated.signals.engagement.tsx", title: "Engagement rhythm", requiresAuth: true, hasLoader: false },
  { path: "/signals/heatmap", file: "src/routes/_authenticated.signals.heatmap.tsx", title: "Wellness heatmap", requiresAuth: true, hasLoader: false },

  { path: "/care/risk", file: "src/routes/_authenticated.care.risk.tsx", title: "Early warning", requiresAuth: true, hasLoader: false },
  { path: "/care/referrals", file: "src/routes/_authenticated.care.referrals.tsx", title: "Referral pipeline", requiresAuth: true, hasLoader: false },
  { path: "/care/capacity", file: "src/routes/_authenticated.care.capacity.tsx", title: "Counsellor capacity", requiresAuth: true, hasLoader: false },

  { path: "/reports", file: "src/routes/_authenticated.reports.index.tsx", title: "Institutional reports", requiresAuth: true, hasLoader: false },

  { path: "/admin", file: "src/routes/_authenticated.admin.index.tsx", title: "Admin overview", requiresAuth: true, hasLoader: false },
  { path: "/admin/members", file: "src/routes/_authenticated.admin.members.tsx", title: "Members", requiresAuth: true, hasLoader: false },
  { path: "/admin/policies", file: "src/routes/_authenticated.admin.policies.tsx", title: "Policies", requiresAuth: true, hasLoader: false },
  { path: "/admin/audit", file: "src/routes/_authenticated.admin.audit.tsx", title: "Audit log", requiresAuth: true, hasLoader: false },

  { path: "/settings/appearance", file: "src/routes/settings.appearance.tsx", title: "Appearance", requiresAuth: true, hasLoader: false },
  { path: "/qa", file: "src/routes/_authenticated/qa.tsx", title: "QA self-check", requiresAuth: true, hasLoader: false },
];
