import type { Profile } from "@/types";

/**
 * Demo profiles. No password, no session persistence — selecting a profile
 * sets React context and a refresh returns to the profile selector.
 *
 * LEVEL D — demonstration scenario. Names are illustrative.
 */
export const PROFILES: Profile[] = [
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    initials: "AM",
    role: "REVIEWER",
    roleLabel: "QA Analyst · Reviewer",
    avatarColour: "#1F3864",
  },
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    initials: "PS",
    role: "REVIEWER",
    roleLabel: "QA Analyst · Reviewer",
    avatarColour: "#2E5FA3",
  },
  {
    id: "rajesh-kumar",
    name: "Rajesh Kumar",
    initials: "RK",
    role: "APPROVER",
    roleLabel: "GM-QA · Approver",
    avatarColour: "#374151",
  },
  {
    id: "cqo",
    name: "CQO",
    initials: "CQ",
    role: "CQO",
    roleLabel: "Chief Quality Officer",
    avatarColour: "#4B5563",
  },
];

export const SITE_NAME = "PharmaCo India — Unit 7";
export const COMPANY_NAME = "PharmaCo India Ltd";

export const getProfile = (id: string): Profile | undefined =>
  PROFILES.find((profile) => profile.id === id);
