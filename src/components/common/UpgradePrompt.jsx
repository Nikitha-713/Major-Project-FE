import Modal from './Modal';

/**
 * Props: info (the 403 response body), onClose, onUpgrade
 * Usage:
 *   catch (err) { if (isUpgradeError(err)) setUpgradeInfo(err.response.data); }
 *   {upgradeInfo && <UpgradePrompt info={upgradeInfo} onClose={() => setUpgradeInfo(null)} />}
 */
export default function UpgradePrompt({ info, onClose, onUpgrade }) {
  const t = info.requiredTier;
  return (
    <Modal open onClose={onClose}>
      <div className="space-y-3 p-2 text-center">
        <h2 className="text-lg font-semibold">Upgrade to unlock this</h2>
        <p className="text-sm text-gray-600">{info.message}</p>
        {info.limit > 0 && <p className="text-xs text-gray-500">Using {info.current} of {info.limit}</p>}
        {t && (
          <p className="text-sm">
            Available on <b>{t.displayName}</b> ({t.currency} {t.priceMonthly}/month)
          </p>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Not now</button>
          <button onClick={onUpgrade} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">View plans</button>
        </div>
      </div>
    </Modal>
  );
}
