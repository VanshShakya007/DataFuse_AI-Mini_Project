import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import WorkflowCard from "../components/WorkflowCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#14392f] antialiased">
      <Navbar />
      <main
        id="what-you-get"
        className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20"
      >
        <Hero />
        <WorkflowCard />
      </main>
    </div>
  );
}