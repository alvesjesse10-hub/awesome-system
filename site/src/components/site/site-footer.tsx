import Link from "next/link";
import type { SiteContent } from "@/types/content";

export function SiteFooter({ content }: { content: SiteContent }) {
  const { footer, market } = content;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-navy-500 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold text-navy-800">LedgerBridge</p>
          <p className="mt-1">{footer.tagline}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href={`/${market}/privacy`}
            className="font-medium text-navy-600 underline-offset-4 hover:text-navy-900 hover:underline"
          >
            {footer.privacyLabel}
          </Link>
          <p>
            © {year} LedgerBridge. {footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
