import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-shell min-h-[80vh] flex flex-col items-center justify-center relative">
      {/* Background glow matching the home page */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(45,212,191,0.15) 0%, transparent 70%)",
        }}
      />
      
      <div className="relative z-10 text-center px-5">
        <h1 className="title-text font-black tracking-tight leading-[1.05]" style={{ fontSize: "clamp(4rem, 10vw, 8rem)" }}>
          404
        </h1>
        <h2 className="title-text mt-4 text-3xl font-bold">
          Page Not Found
        </h2>
        <p className="soft-text mt-6 text-lg max-w-md mx-auto leading-8">
          Sorry, we couldn't find the page you're looking for. It might have been removed or the link might be broken.
        </p>
        <div className="mt-10">
          <Link href="/" className="btn-primary px-7 py-3.5 rounded-xl text-base inline-block">
            Go back home →
          </Link>
        </div>
      </div>
    </div>
  );
}
