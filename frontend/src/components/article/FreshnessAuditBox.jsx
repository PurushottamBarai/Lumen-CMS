import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, Sparkles } from 'lucide-react';
import { articleAPI } from '../../services/api';

const FreshnessAuditBox = ({ title = '', content = '' }) => {
  const [audit, setAudit] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (!content || content.length < 20) {
      setAudit(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsAuditing(true);
        const response = await articleAPI.auditDraftFreshness({ title, content });
        if (response.data && response.data.audit) {
          setAudit(response.data.audit);
        }
      } catch (err) {
        console.warn('[FreshnessAuditBox] Audit error:', err.message);
      } finally {
        setIsAuditing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, content]);

  if (!audit) return null;

  const { freshnessScore = 96, auditSummary = '', scannedCitationsCount = 0 } = audit;
  const isHealthy = freshnessScore >= 90;

  return (
    <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex flex-col gap-2.5 shadow-2xs my-3 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
          <History className="w-4 h-4 text-amber-700" />
          <span>Content Freshness &amp; Source Audit</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
          isHealthy ? 'bg-amber-200/90 text-amber-950' : 'bg-rose-100 text-rose-800'
        }`}>
          {isAuditing ? 'Auditing...' : `${freshnessScore}% Fresh`}
        </span>
      </div>

      <p className="text-xs text-amber-900 leading-relaxed font-normal">
        {auditSummary}
      </p>

      {scannedCitationsCount > 0 && (
        <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
          <span>
            {scannedCitationsCount} external source {scannedCitationsCount === 1 ? 'link' : 'links'} verified active
          </span>
        </div>
      )}
    </div>
  );
};

export default FreshnessAuditBox;
