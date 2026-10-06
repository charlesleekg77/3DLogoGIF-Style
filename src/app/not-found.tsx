import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-[1440px] place-items-center px-6 lg:px-10">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-void-400">
          404 · not found
        </p>
        <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tightest text-void-50">
          That render has spun off.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-void-300">
          The page or template you were looking for does not exist. The studio is still where you
          left it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-neon px-6 py-3">
            Back to studio
          </Link>
          <Link href="/gallery" className="btn-ghost px-6 py-3">
            Browse showcase
          </Link>
        </div>
      </div>
    </div>
  );
}
