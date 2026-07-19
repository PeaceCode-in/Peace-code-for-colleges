// Whitelist of partner institution email domains for PeaceCode for Colleges.
// A larger registry (and real provisioning) will live in Lovable Cloud later;
// this file is the local source of truth for domain → college identity.

export type College = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  colorAccent: string; // hex, used for the sidebar logo circle
  role: string;       // default admin role label
};

export const COLLEGES: Record<string, College> = {
  "iitb.ac.in": {
    id: "iitb",
    name: "Indian Institute of Technology Bombay",
    shortName: "IIT Bombay",
    initials: "IB",
    colorAccent: "#3F6B4E",
    role: "Head of Counselling Cell",
  },
  "du.ac.in": {
    id: "du",
    name: "University of Delhi",
    shortName: "Delhi University",
    initials: "DU",
    colorAccent: "#B78A3A",
    role: "Dean of Student Wellbeing",
  },
  "iitd.ac.in": {
    id: "iitd",
    name: "Indian Institute of Technology Delhi",
    shortName: "IIT Delhi",
    initials: "ID",
    colorAccent: "#2F6B6B",
    role: "Head of Counselling Cell",
  },
  "bits-pilani.ac.in": {
    id: "bitsp",
    name: "Birla Institute of Technology and Science, Pilani",
    shortName: "BITS Pilani",
    initials: "BP",
    colorAccent: "#6B3F52",
    role: "Chief Wellness Officer",
  },
  "nitk.edu.in": {
    id: "nitk",
    name: "National Institute of Technology Karnataka",
    shortName: "NITK Surathkal",
    initials: "NK",
    colorAccent: "#4A5A63",
    role: "Head of Counselling Cell",
  },
};

export function domainFor(email: string): string | null {
  const m = email.trim().toLowerCase().match(/^[^@\s]+@([a-z0-9.-]+\.[a-z]{2,})$/i);
  return m ? m[1] : null;
}

export function collegeFor(email: string): College | null {
  const d = domainFor(email);
  return d ? COLLEGES[d] ?? null : null;
}
