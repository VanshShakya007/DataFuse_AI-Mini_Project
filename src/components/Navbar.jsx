export default function Navbar() {
  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <a href="#" className="text-xl font-extrabold tracking-tight text-[#14392f]">
          DataFuse AI
        </a>
        <ul className="flex items-center gap-6 text-sm text-neutral-500 sm:gap-8">
          <li>
            <a href="#how-it-works" className="transition-colors hover:text-[#14392f]">
              How it works
            </a>
          </li>
          <li>
            <a href="#what-you-get" className="transition-colors hover:text-[#14392f]">
              What you get
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}