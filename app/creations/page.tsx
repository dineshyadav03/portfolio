import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import CreationsList from "@/components/CreationsList";
import { profile, projects } from "@/lib/content";

export const metadata: Metadata = {
  title: `Creations — ${profile.name}`,
};

export default function CreationsPage() {
  return (
    <SectionPage command="ls -la ./creations">
      <CreationsList projects={projects} />
    </SectionPage>
  );
}
