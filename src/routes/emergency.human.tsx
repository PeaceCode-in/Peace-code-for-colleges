import { createFileRoute } from "@tanstack/react-router";
import { Page, BackBar, PageTitle, BigAction } from "@/components/emergency/primitives";
import { UserCheck, CalendarCheck, MessageCircle, Users, Phone, GraduationCap } from "lucide-react";

function ConnectHuman() {
  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Connect to a human" title="You don't have to do this alone." sub="Pick whoever feels the least heavy right now. Anyone below is a valid choice." />

      <div className="grid gap-3 sm:grid-cols-2">
        <BigAction to="/buddies" icon={<UserCheck className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Talk to a Peace Buddy" sub="Trained student peers. Free, warm, non-judgmental." />
        <BigAction to="/counselling" icon={<CalendarCheck className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Book a counsellor" sub="Professional support — audio, video, or in-person." />
        <BigAction to="/counselling/messages" icon={<MessageCircle className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Live chat (placeholder)" sub="Message your counsellor if you have an ongoing session." />
        <BigAction to="/emergency/contacts" icon={<Phone className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="A trusted contact" sub="A parent, sibling, or close friend. One tap to call." />
        <BigAction to="/community" icon={<Users className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="A community circle" sub="Not alone — others are quietly here too." />
        <BigAction to="/counselling/experts" icon={<GraduationCap className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Campus counsellor" sub="See your college's on-campus support team." />
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/human")({ component: ConnectHuman });
