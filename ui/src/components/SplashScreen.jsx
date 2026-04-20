import { useState, useEffect } from "react";
import burgerLogo from "../assets/burger-loader-md.png";

const facts = [
  "Warren Buffett bought his first stock at age 11...",
  "He filed his first tax return at age 13, claiming a $35 deduction for his bicycle...",
  "Buffett still lives in the same Omaha house he bought in 1958 for $31,500...",
  "He drinks at least five cans of Coca-Cola every day...",
  "Berkshire Hathaway was originally a textile company...",
  "He reads 500 pages a day — that's how knowledge builds up, like compound interest...",
  "Buffett pledged to give away 99% of his wealth to charity...",
  "His annual salary as Berkshire CEO? Just $100,000 — unchanged for 25+ years...",
];

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const duration = 7500;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => setFadeOut(true), 300);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  useEffect(() => {
    if (fadeOut) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }
  }, [fadeOut, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 dark:bg-[#0d1520] ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Burger logo with grayscale-to-color transition */}
      <div className="relative mb-8">
        {/* Grayscale base layer — always visible */}
        <img
          src={burgerLogo}
          alt="Loading"
          className="h-36 w-36 object-contain"
          style={{ filter: "grayscale(100%) brightness(0.85)", opacity: 0.5 }}
        />
        {/* Color layer — clipped by progress */}
        <img
          src={burgerLogo}
          alt=""
          className="absolute inset-0 h-36 w-36 object-contain transition-[clip-path] duration-300 ease-linear"
          style={{
            clipPath: `inset(${100 - progress}% 0 0 0)`,
          }}
        />
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-red-500 transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Percentage */}
      <p className="mb-6 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {Math.round(progress)}%
      </p>

      {/* Fun fact */}
      <div className="h-12 max-w-md px-6 text-center">
        <p
          key={factIndex}
          className="animate-fade-in text-sm leading-relaxed text-slate-500 dark:text-slate-400"
        >
          {facts[factIndex]}
        </p>
      </div>

      <p className="mt-8 text-xs font-medium tracking-widest uppercase text-slate-400 dark:text-slate-600">
        Buffett Intelligence
      </p>
    </div>
  );
}
