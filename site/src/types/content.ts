export type Market = "br" | "us";

export interface SiteContent {
  market: Market;
  locale: string;
  htmlLang: string;
  meta: {
    title: string;
    description: string;
  };
  nav: {
    services: string;
    howItWorks: string;
    about: string;
    contact: string;
    cta: string;
    switchLabel: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    bullets: string[];
  };
  services: {
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[];
  };
  about: {
    title: string;
    paragraphs: string[];
    highlights: string[];
  };
  proof: {
    title: string;
    items: { title: string; description: string }[];
  };
  ctaSection: {
    title: string;
    subtitle: string;
    formTitle: string;
  };
  form: {
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    company: string;
    companyPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    privacy: string;
  };
  footer: {
    tagline: string;
    rights: string;
    privacyLabel: string;
  };
  privacy: {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: { heading: string; body: string }[];
  };
}
