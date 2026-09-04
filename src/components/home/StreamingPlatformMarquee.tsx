import React from 'react';
import { Radio, Server, Signal, Cpu, Globe } from 'lucide-react';

const platforms = [
  { name: 'RadioKing', icon: Radio, desc: 'Cloud Radio Streaming' },
  { name: 'Zeno Media', icon: Globe, desc: 'Global Audio Infrastructure' },
  { name: 'Shoutcast', icon: Signal, desc: 'Classic Digital Broadcast' },
  { name: 'Icecast', icon: Server, desc: 'Open Audio Streaming Server' },
  { name: 'AzuraCast', icon: Cpu, desc: 'Self-Hosted Radio Suite' },
];

export function StreamingPlatformMarquee() {
  return (
    <div className="py-6 border-y border-slate-800/80 bg-slate-950/40 rounded-3xl space-y-3">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
        Supports stations powered by leading streaming platforms
      </p>

      <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap px-4">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.name}
              className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors py-1 group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-sky-500/40">
                <Icon className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-400 transition-colors" />
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-300 group-hover:text-white">
                {p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
