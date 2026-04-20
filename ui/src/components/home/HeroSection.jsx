import buffettImg from "../../assets/warren-buffet.gif";

export default function HeroSection() {
  return (
    <section className="overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-900">
      <div className="flex flex-col-reverse md:flex-row">
        {/* Text */}
        <div className="flex flex-1 flex-col justify-center px-8 py-10 md:px-12 md:py-14">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Inside the $900 Billion Empire
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
            From a failing textile mill to a $900B conglomerate spanning insurance,
            railroads, energy, and tech — Berkshire Hathaway is the ultimate testament
            to patient capital allocation. With 389,000 employees and stakes in Apple,
            Coca-Cola, and American Express, it's a portfolio unlike any other.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
            <span>Business</span>
            <span className="text-slate-700">|</span>
            <span>Buffett Intelligence</span>
            <span className="text-slate-700">|</span>
            <span>2025</span>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full md:w-[40%] lg:w-[38%] shrink-0">
          <img
            src={buffettImg}
            alt="Warren Buffett"
            className="h-64 w-full object-cover md:h-full md:min-h-[340px]"
          />
        </div>
      </div>
    </section>
  );
}
