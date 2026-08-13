import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="bg-ink min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-line corner-marks p-10 bg-ink-2">
        <div className="tag-mono-acid mb-4">// SIGNUP</div>
        <h1 className="display text-3xl text-ivory mb-4">
          REGISTRATION<br />CLOSED<span className="text-acid">.</span>
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          TESLA Club accounts are provisioned by administrators only. To join,
          attend any open session or contact the core team.
        </p>
        <Link href="/contact" className="btn-acid">
          Contact core team
        </Link>
      </div>
    </div>
  );
}
