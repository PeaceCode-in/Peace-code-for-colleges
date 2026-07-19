import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Beaker, AlertTriangle } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead, PrimaryBtn, GhostBtn } from "@/components/hub/primitives";
import { BETA_FEATURES, isBetaEnrolled, toggleBeta, subscribe } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, soft } = palette;

function Beta() {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const enrolled = isBetaEnrolled();

  return (
    <Page>
      <BackBar />
      <PageTitle
        eyebrow="Beta program"
        title="Try what's next, softly."
        sub="Opt in to preview features. They may wobble; your feedback shapes them."
      />

      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-60" style={{ background: soft }}/>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <Chip tone={enrolled ? "warm" : "outline"}>
              <Beaker className="w-3 h-3"/> {enrolled ? "Enrolled" : "Not enrolled"}
            </Chip>
            <div className="font-serif text-[20px] mt-2" style={{ color: ink }}>
              {enrolled ? "You're in the beta channel." : "Join the beta channel."}
            </div>
            <p className="text-[12.5px] mt-1 max-w-md" style={{ color: muted }}>
              You'll get pre-release features first. Toggle off anytime — nothing is lost.
            </p>
          </div>
          {enrolled ? (
            <GhostBtn onClick={toggleBeta}>Leave beta</GhostBtn>
          ) : (
            <PrimaryBtn onClick={toggleBeta}>Enroll in beta</PrimaryBtn>
          )}
        </div>
      </Card>

      <SectionHead title="Available in beta" sub={`${BETA_FEATURES.length} features to try`}/>
      <div className="grid gap-3">
        {BETA_FEATURES.map((f) => (
          <Card key={f.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-serif text-[16px]" style={{ color: ink }}>{f.name}</div>
                <div className="text-[12.5px] mt-1" style={{ color: muted }}>{f.desc}</div>
                {f.bugs.length > 0 && (
                  <div className="mt-3 rounded-xl p-2.5 inline-flex items-start gap-2" style={{ background: surface2, border: `1px solid ${border}` }}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5" style={{ color: "#c98a5a" }}/>
                    <div className="text-[11.5px]" style={{ color: muted }}>{f.bugs[0]}</div>
                  </div>
                )}
              </div>
              <Chip tone={enrolled ? "warm" : "outline"}>{enrolled ? "Active" : "Locked"}</Chip>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-[11.5px] mt-6" style={{ color: muted }}>
        Report bugs and reflections via <span style={{ color: primary }}>Settings → Feedback</span>. Thank you for testing quietly.
      </p>
    </Page>
  );
}

export const Route = createFileRoute("/hub/beta")({ component: Beta });
