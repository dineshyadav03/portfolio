import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import ReflectionsList from "@/components/ReflectionsList";
import { profile, posts } from "@/lib/content";

export const metadata: Metadata = {
  title: `Reflections — ${profile.name}`,
};

export default function ReflectionsPage() {
  return (
    <SectionPage command="ls -la ./reflections">
      <ReflectionsList posts={posts} />
    </SectionPage>
  );
}
