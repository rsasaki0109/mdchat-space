"use client";

import { useUiLocale } from "@/lib/ui-locale";

function shortDmLabel(path: string): string {
  const id = path.replace(/^\/dm\//, "");
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

type DemoDmPanelProps = {
  rooms: string[];
  disabled: boolean;
  onNewRoom: () => void;
  onOpenRoom: (channel: string) => void;
  /** デモ用: DM ルームの表示名（未設定時はパスの短縮形）。 */
  roomLabel?: (path: string) => string;
};

export function DemoDmPanel({
  rooms,
  disabled,
  onNewRoom,
  onOpenRoom,
  roomLabel,
}: DemoDmPanelProps) {
  const { t } = useUiLocale();
  return (
    <div className="panel border-slate-200/75 bg-white/[0.92] p-4 shadow-sm ring-1 ring-slate-900/[0.03]">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.dmDemoKicker}</p>
      <h3 className="mt-1 text-base font-semibold text-ink">{t.dmDemoTitle}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-600">{t.dmDemoBody}</p>
      <button
        type="button"
        onClick={onNewRoom}
        disabled={disabled}
        className="mt-3 w-full rounded-full bg-slateblue px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {t.dmDemoNew}
      </button>
      {rooms.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">{t.dmDemoEmpty}</p>
      ) : (
        <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
          {rooms.map((path) => (
            <li key={path}>
              <button
                type="button"
                title={path}
                disabled={disabled}
                onClick={() => onOpenRoom(path)}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-left text-xs font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {roomLabel ? roomLabel(path) : shortDmLabel(path)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
