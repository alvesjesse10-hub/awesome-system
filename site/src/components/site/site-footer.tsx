import type { SiteContent } from "@/types/content";

export function SiteFooter({ content }: { content: SiteContent }) {
  const { footer } = content;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-navy-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-navy-800">LedgerBridge</p>
          <p className="mt-1">{footer.tagline}</p>
        </div>
        <p>
          © {year} LedgerBridge. {footer.rights}
        </p>
      </div>
    </footer>
  );
}
