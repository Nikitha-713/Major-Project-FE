import Button from './Button.jsx';

export default function UpgradeModal({ isOpen, onClose, reason }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-mist">
        <h2 className="font-display text-2xl font-bold text-tide">Upgrade Required</h2>
        <p className="mt-3 text-ink/80">
          {reason || 'You have reached the limit of your current plan.'}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Maybe later</Button>
          <Button onClick={() => window.location.href = '/dashboard/billing'}>View Plans</Button>
        </div>
      </div>
    </div>
  );
}