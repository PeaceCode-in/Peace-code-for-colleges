import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCcw, Shield, ExternalLink, Unlink } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead, PrimaryBtn, GhostBtn, Toggle } from "@/components/hub/primitives";
import {
  integrationById, isConnected, connect, disconnect,
  updateIntegration, togglePermission, manualSync, subscribe, getState,
} from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary } = palette;

function relative(ts?: number) {
  if (!ts) return "Never";
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function IntegrationDetail() {
  const { id } = Route.useParams();
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const i = integrationById(id);
  if (!i) throw notFound();

  const connected = isConnected(i.id);
  const state = getState().connectedIntegrations[i.id];

  return (
    <Page>
      <BackBar to="/hub/integrations" label="Integrations"/>
      <PageTitle
        eyebrow={i.category}
        title={i.name}
        sub={i.tagline}
        right={connected
          ? <Chip tone="warm"><CheckCircle2 className="w-3 h-3"/> Connected</Chip>
          : <Chip tone="outline">Not connected</Chip>}
      />

      <Card className="mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-serif text-[18px] text-white shrink-0"
               style={{ background: i.brandHue }}>{i.monogram}</div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[18px]" style={{ color: ink }}>{i.name}</div>
            <div className="text-[12px]" style={{ color: muted }}>Last sync · {relative(state?.lastSync)}</div>
          </div>
          {!connected ? (
            <PrimaryBtn onClick={() => connect(i.id)}>Connect</PrimaryBtn>
          ) : (
            <div className="flex items-center gap-2">
              <GhostBtn onClick={() => manualSync(i.id)}><RefreshCcw className="w-3.5 h-3.5"/> Sync now</GhostBtn>
              <GhostBtn onClick={() => disconnect(i.id)}><Unlink className="w-3.5 h-3.5"/> Disconnect</GhostBtn>
            </div>
          )}
        </div>
      </Card>

      {connected && state && (
        <>
          <Card className="mb-4">
            <SectionHead title="Sync"/>
            <div className="flex flex-wrap gap-2">
              {i.syncFrequencies.map((f) => (
                <Chip key={f} tone="quiet" active={state.frequency === f}
                  onClick={() => updateIntegration(i.id, { frequency: f })}>{f}</Chip>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <Toggle label="Auto-sync" hint="Sync on the frequency above." on={state.autoSync}
                onChange={(b) => updateIntegration(i.id, { autoSync: b })}/>
              <Toggle label="Background sync" hint="Continue when PeaceCode is closed." on={state.backgroundSync}
                onChange={(b) => updateIntegration(i.id, { backgroundSync: b })}/>
            </div>
          </Card>

          <Card className="mb-4">
            <SectionHead title="Permissions" sub="Granular control over what this service can see."/>
            <div className="grid gap-2">
              {i.permissions.map((pm) => (
                <Toggle key={pm.key} label={pm.label} hint={pm.kind === "read" ? "Read only" : "Write access"}
                  on={!!state.permissions[pm.key]} onChange={() => togglePermission(i.id, pm.key)}/>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card>
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: surface2, color: primary, border: `1px solid ${border}` }}>
            <Shield className="w-4 h-4"/>
          </span>
          <div className="min-w-0">
            <div className="font-serif text-[15px]" style={{ color: ink }}>Privacy</div>
            <div className="text-[12.5px] mt-1" style={{ color: muted }}>
              PeaceCode never stores your credentials — connections use OAuth. Disconnect anytime and cached data is removed within 24 hours.
            </div>
            {i.privacyUrl && (
              <a href={i.privacyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-[12px]" style={{ color: primary }}>
                Read {i.name} privacy policy <ExternalLink className="w-3 h-3"/>
              </a>
            )}
          </div>
        </div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/hub/integrations/$id")({ component: IntegrationDetail });
