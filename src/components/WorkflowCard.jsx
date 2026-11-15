import { BarChart3, FileText, LayoutGrid } from "lucide-react";

const steps = [
  { id: "01", title: "Prepare", sub: "Clean + engineer features", Icon: LayoutGrid },
  { id: "02", title: "Explore", sub: "EDA + relationships", Icon: BarChart3 },
  { id: "03", title: "Evaluate", sub: "Compare ML models", Icon: BarChart3 },
];

const outputs = ["Insights", "Visualizations", "Recommendations"];

const LINE = "bg-neutral-300";
// horizontal centre of the 1st / 3rd column in a 3-col grid with gap-3 (1.5rem total gap)
const COL_1 = "calc((100% - 1.5rem) / 6)";
const COL_3 = "calc(100% - (100% - 1.5rem) / 6)";

const StepCard = ({ id, title, sub, Icon }) => (
  <div className="relative rounded-lg border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
    {/* connector stubs */}
    <span className={`absolute -top-6 left-1/2 h-6 w-px ${LINE}`} />
    <span className={`absolute -bottom-6 left-1/2 h-6 w-px ${LINE}`} />

    <div className="flex items-start justify-between">
      <Icon className="h-4 w-4 text-[#0e7c66]" />
      <span className="text-[10px] text-neutral-400">{id}</span>
    </div>
    <p className="mt-4 text-sm font-semibold text-[#14392f]">{title}</p>
    <p className="mt-0.5 text-[10px] leading-tight text-neutral-500 sm:text-[11px]">{sub}</p>
  </div>
);

export default function WorkflowCard() {
  return (
    <div
      id="how-it-works"
      className="rounded-2xl border border-neutral-200 bg-neutral-100 p-5 sm:p-6"
    >
      {/* header row */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
          From upload to understanding
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] text-[#14392f] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0e7c66]" />
          One connected flow
        </span>
      </div>

      <div className="flex flex-col items-center">
        {/* dataset */}
        <div className="flex w-[52%] items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <FileText className="h-4 w-4 shrink-0 text-[#0e7c66]" />
          <div>
            <p className="text-sm font-semibold text-[#14392f]">Your dataset.csv</p>
            <p className="text-[10px] text-neutral-500">The starting point</p>
          </div>
        </div>

        <span className={`h-6 w-px ${LINE}`} />

        {/* three steps */}
        <div className="relative w-full">
          <span
            className={`absolute top-0 h-px ${LINE}`}
            style={{ left: COL_1, right: `calc(100% - ${COL_3})` }}
          />
          <div className="grid grid-cols-3 gap-3 pt-6">
            {steps.map((s) => (
              <StepCard key={s.id} {...s} />
            ))}
          </div>

          {/* merge connectors */}
          <div className="relative h-12">
            <span
              className={`absolute bottom-6 h-px ${LINE}`}
              style={{ left: COL_1, right: `calc(100% - ${COL_3})` }}
            />
            <span className={`absolute bottom-0 left-1/2 h-6 w-px ${LINE}`} />
          </div>
        </div>

        {/* output */}
        <div className="w-[88%] rounded-xl bg-[#14392f] p-4 shadow-md sm:p-5">
          <p className="text-sm font-medium text-white sm:text-base">
            A clearer picture of what comes next.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {outputs.map((label, i) => (
              <span
                key={label}
                className={`rounded-md px-2 py-2 text-center text-[10px] font-medium sm:text-[11px] ${
                  i === outputs.length - 1
                    ? "bg-[#d9f08a] text-[#14392f]"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}