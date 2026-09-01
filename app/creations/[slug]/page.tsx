import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionPage from "@/components/SectionPage";
import ProjectDetail from "@/components/ProjectDetail";
import { profile, projectBySlug, projectSlug, projects } from "@/lib/content";

// Every project's own page is known ahead of time from the same real data
// list everywhere else on the site reads from — no client-side lookup, no
// loading state, a real static page per project.
export function generateStaticParams() {
  return projects.map((p) => ({ slug: projectSlug(p.name) }));
}

export async function generateMetadata({ params }: PageProps<"/creations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return { title: "Not found" };
  return {
    title: project.name,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: PageProps<"/creations/[slug]">) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  return (
    <SectionPage command={`cat creations/${slug}.txt`}>
      <h1 className="srOnly">
        {project.name} — {profile.name}
      </h1>
      <ProjectDetail project={project} />
    </SectionPage>
  );
}
