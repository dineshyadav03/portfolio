import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import CreationsList from "@/components/CreationsList";
import { profile, projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
};

export default function CreationsPage() {
  return (
    <SectionPage command="ls -la ./creations">
      <h1 className="srOnly">Work — {profile.name}</h1>
      <CreationsList projects={projects} />
    </SectionPage>
  );
}
