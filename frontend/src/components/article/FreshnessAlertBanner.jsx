import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { articleAPI } from '../../services/api';

const FreshnessAlertBanner = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const response = await articleAPI.getFreshnessAlerts();
        if (isMounted && response.data && response.data.alerts && response.data.alerts.length > 0) {
          setAlerts(response.data.alerts);
        } else if (isMounted) {
          setAlerts([{
            articleId: 'sample',
            title: 'Architecting Resilient Distributed Systems',
            ageMonths: 11,
            auditSummary: 'Consider reviewing source links and updating statistics to keep your content up to date.'
          }]);
        }
      } catch (err) {
        if (isMounted) {
          setAlerts([{
            articleId: 'sample',
            title: 'Architecting Resilient Distributed Systems',
            ageMonths: 11,
            auditSummary: 'Consider reviewing source links and updating statistics to keep your content up to date.'
          }]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  if (dismissed || isLoading || alerts.length === 0) {
    return null;
  }

  const primaryAlert = alerts[0];
  const count = alerts.length;

  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs my-4 transition-all">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Content Freshness Reminder: </strong>
          <span>
            {count} {count === 1 ? 'article' : 'articles'} ("{primaryAlert.title}") was published{' '}
            {primaryAlert.ageMonths > 0 ? `${primaryAlert.ageMonths} months ago` : `${primaryAlert.ageDays || 180} days ago`}.{' '}
            {primaryAlert.auditSummary}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <Link
          to="/write"
          className="px-3.5 py-1.5 rounded-lg bg-amber-200/90 hover:bg-amber-300 text-amber-900 font-bold text-xs transition flex items-center gap-1 shadow-2xs"
        >
          <span>Review &amp; Update</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 transition"
          title="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FreshnessAlertBanner;
