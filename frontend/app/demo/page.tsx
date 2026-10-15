import type { Metadata } from "next";
import { DemoExperience } from "./DemoExperience";

export const metadata: Metadata = {
  title: "Live Demo — Signal Graph",
  description:
    "Read from a fixed collection and watch your newspaper feed adapt in real time.",
};

export default function DemoPage() {
  return <DemoExperience />;
}
