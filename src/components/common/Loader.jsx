export default function Loader({ label = 'Loading' }) {
  return (
    <div role="status" className="grid min-h-[40vh] place-items-center text-ink/60">
      <span>{label}…</span>
    </div>
  );
}
