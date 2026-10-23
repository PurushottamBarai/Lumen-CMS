import React, { useState } from 'react';
import { TrendingUp, BarChart2, Eye, Sparkles } from 'lucide-react';

const EngagementChart = ({ data = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-stone-400">
        No readership history available.
      </div>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views || 0), 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#1A382B]" />
            <span className="font-medium">Monthly Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium">Engagement Rate (%)</span>
          </div>
        </div>

        {hoveredIndex !== null && (
          <div className="bg-stone-900 text-white px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-md animate-fade-in">
            {data[hoveredIndex].month}: {data[hoveredIndex].views.toLocaleString()} views • {data[hoveredIndex].engagementRate}% eng.
          </div>
        )}
      </div>

      {/* SVG Bar & Curve Container */}
      <div className="relative h-56 w-full pt-4 pb-6">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-stone-300 w-full" />
          <div className="border-b border-stone-300 w-full" />
          <div className="border-b border-stone-300 w-full" />
        </div>

        {/* Bars Container */}
        <div className="relative h-full flex items-end justify-between gap-2 sm:gap-4 px-2">
          {data.map((item, idx) => {
            const heightPercent = Math.max(12, Math.round((item.views / maxViews) * 100));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.month || idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bar */}
                <div className="w-full max-w-[36px] bg-stone-100 rounded-t-lg relative flex items-end justify-center transition-all">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isHovered
                        ? 'bg-emerald-700 shadow-md scale-y-102'
                        : 'bg-[#1A382B] group-hover:bg-[#254F3D]'
                    }`}
                  />
                  {/* Engagement indicator pip */}
                  <div
                    style={{ bottom: `${Math.min(95, heightPercent + 4)}%` }}
                    className="absolute -top-1 w-2 h-2 rounded-full bg-emerald-400 border border-white shadow-xs pointer-events-none"
                    title={`Engagement: ${item.engagementRate}%`}
                  />
                </div>

                {/* X-axis Label */}
                <span
                  className={`text-[11px] font-mono mt-2 transition-colors ${
                    isHovered ? 'text-stone-900 font-bold' : 'text-stone-400'
                  }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EngagementChart;
