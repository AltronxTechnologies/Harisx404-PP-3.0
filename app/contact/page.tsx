import { HeroTexture } from "@/app/components/HeroTexture";
import type { Metadata } from "next";
import { GridWrapper } from "@/app/components/GridWrapper";
import { ContactClient } from "@/app/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Contact | Get in Touch - Muhammad Haris",
  description:
    "Book a call or send Muhammad Haris a message — available for full-time roles and freelance projects.",
};

export default function ContactPage() {
  return (
    <div className="relative">
      <HeroTexture />
      <GridWrapper>
        <ContactClient />
      </GridWrapper>
    </div>
  );
}
