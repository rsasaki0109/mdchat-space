"use client";

import type { ChannelNode } from "@/lib/types";
import { useUiLocale } from "@/lib/ui-locale";


type ChannelSidebarProps = {
  channels: ChannelNode[];
  selectedChannel: string;
  onSelect: (channelPath: string) => void;
};


function ChannelBranch({
  node,
  selectedChannel,
  onSelect,
}: {
  node: ChannelNode;
  selectedChannel: string;
  onSelect: (channelPath: string) => void;
}) {
  const selected = node.path === selectedChannel;

  return (
    <li className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect(node.path)}
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition ${
          selected
            ? "bg-amber-100 text-amber-900"
            : "bg-white/60 text-slateblue hover:bg-white"
        }`}
      >
        <span className="truncate font-medium">{node.path}</span>
        <span className="ml-3 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {node.total_post_count}
        </span>
      </button>

      {node.children.length > 0 ? (
        <ul className="ml-4 space-y-2 border-l border-slate-200 pl-4">
          {node.children.map((child) => (
            <ChannelBranch
              key={child.path}
              node={child}
              selectedChannel={selectedChannel}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}


export function ChannelSidebar({ channels, selectedChannel, onSelect }: ChannelSidebarProps) {
  const { t } = useUiLocale();
  return (
    <aside className="panel h-full p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.sidebarChannelsLabel}</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">{t.sidebarTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t.sidebarDescription}</p>
      </div>

      {channels.length === 0 ? (
        <div className="panel-muted p-4 text-sm text-slate-600">{t.sidebarEmpty}</div>
      ) : (
        <ul className="space-y-3">
          {channels.map((node) => (
            <ChannelBranch
              key={node.path}
              node={node}
              selectedChannel={selectedChannel}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
