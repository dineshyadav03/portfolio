import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import ContactInfo from "@/components/ContactInfo";
import { profile } from "@/lib/content";

export const metadata: Metadata = {
  title: `Contact — ${profile.name}`,
};

export default function ContactPage() {
  return (
    <SectionPage command="cat contact.txt">
      <ContactInfo />
    </SectionPage>
  );
}
