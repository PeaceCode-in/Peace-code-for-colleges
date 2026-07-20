import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const SITE_URL = "https://colleges.peacecode.in";
const SITE_NAME = "PeaceCode for Colleges";
const SITE_DESC =
  "PeaceCode for Colleges is a privacy-first institutional wellbeing dashboard for universities and colleges. Aggregate-only insights on student mental health — k-anonymity ≥ 10, no individual student is ever identifiable.";

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "PeaceCode",
      alternateName: "PeaceCode for Colleges",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      sameAs: [
        "https://peacecode.in",
        "https://peacecode.in/colleges",
        "https://peacecode.in/for-colleges",
        "https://peacecode.in/about",
        "https://www.linkedin.com/company/peacecode",
        "https://x.com/PeaceCode",
      ],
      email: "partnerships@peacecode.in",
      description: SITE_DESC,
      knowsAbout: [
        "student mental health",
        "college counselling analytics",
        "wellbeing dashboards",
        "PHQ-9",
        "GAD-7",
        "k-anonymity",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Higher-Education Analytics",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESC,
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "college administrator",
      },
      featureList: [
        "Executive wellbeing dashboard",
        "Department & cohort deep-dive",
        "PHQ-9 / GAD-7 screening signals",
        "Early-warning risk routing",
        "Aggregate reporting & exports",
        "k-anonymity ≥ 10 enforcement",
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@id": `${SITE_URL}/#org` },
    },
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" },
      { name: "theme-color", content: "#f6f4ef", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0f1210", media: "(prefers-color-scheme: dark)" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "PeaceCode" },
      { name: "format-detection", content: "telephone=no" },
      { title: `${SITE_NAME} — Institutional Wellbeing Dashboard` },
      { name: "description", content: SITE_DESC },
      { name: "author", content: "PeaceCode" },
      { name: "application-name", content: SITE_NAME },
      { name: "keywords", content: "college mental health dashboard, university wellbeing analytics, student counselling insights, PHQ-9 GAD-7 institutional, k-anonymity student data, higher education wellness platform, PeaceCode" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: `${SITE_NAME} — Institutional Wellbeing Dashboard` },
      { property: "og:description", content: SITE_DESC },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@PeaceCode" },
      { name: "twitter:title", content: `${SITE_NAME} — Institutional Wellbeing Dashboard` },
      { name: "twitter:description", content: SITE_DESC },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Noto+Sans+Devanagari:wght@300;400;500;600&family=Noto+Serif+Devanagari:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(ORG_JSONLD),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('peacecode.theme.v1');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;if(t==='dark'){r.classList.add('dark');}r.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    import("../lib/client-error-monitor")
      .then((m) => m.installClientErrorMonitor())
      .catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
