import { Check } from "lucide-react";
import PrimaryButton from "./PrimaryButton";

const Bullet = ({ children }) => (
  <li className="flex items-center gap-2 text-sm text-[#14392f]">
    <Check className="h-4 w-4 text-[#0e7c66]" strokeWidth={2.5} />
    {children}
  </li>
);

export default function Hero() {
  return (
    <div className="flex flex-col justify-center">
      <span className="mb-8 inline-block w-fit rounded-full bg-neutral-100 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0e7c66]">
        A little data. A lot of possibility.
      </span>

      <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-[#14392f] sm:text-6xl">
        Your data.
        <br />
        A clearer picture.
      </h1>

      <p className="mt-6 max-w-md text-lg leading-relaxed text-neutral-500">
        Turn a CSV into meaningful insights, beautiful charts, and a well-reasoned
        next step. No guesswork required.
      </p>

      <div className="mt-10">
        <PrimaryButton>Try it now</PrimaryButton>
        <p className="mt-4 text-xs text-neutral-500">
          Start with your CSV. See what&rsquo;s possible.
        </p>
      </div>

      <ul className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
        <Bullet>Explainable insights</Bullet>
        <Bullet>Model recommendations</Bullet>
      </ul>
    </div>
  );
}