import { ArrowRight } from "lucide-react";

export default function PrimaryButton({ children, href = "#" }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-md bg-[#0e7c66] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b6553] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7c66] focus-visible:ring-offset-2"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}