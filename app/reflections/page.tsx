import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import ReflectionsList from "@/components/ReflectionsList";
import { profile, posts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
};

export default function ReflectionsPage() {
  return (
    <SectionPage command="ls -la ./reflections">
      <h1 className="srOnly">Writing — {profile.name}</h1>
      <ReflectionsList posts={posts} />
    </SectionPage>
  );
}
