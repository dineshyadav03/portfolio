import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";
import ContactInfo from "@/components/ContactInfo";
import GlobeContact from "@/components/GlobeContact";
import { profile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <SectionPage command="cat contact.txt">
      <h1 className="srOnly">Contact — {profile.name}</h1>
      <GlobeContact />
      <ContactInfo />
    </SectionPage>
  );
}
