/** Wordmark : « tej ta puff », avec « puff » barré. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-[0.22em] font-extrabold tracking-tight ${className}`}>
      <span>tej</span>
      <span>ta</span>
      <span className="relative">
        puff
        <span
          aria-hidden
          className="absolute left-[-6%] right-[-6%] top-[55%] h-[0.16em] -rotate-6 rounded-full bg-braise"
        />
      </span>
    </span>
  );
}
