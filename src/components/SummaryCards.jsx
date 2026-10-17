import React from 'react';
import { Icon } from './Icons';

export function SummaryCards({ incidents = [], responders = [], onSelectFilter, activeFilter }) {
  // Dynamically calculate values from current dataset
  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter(
    (inc) => inc.severity?.toLowerCase() === 'critical' && inc.status?.toLowerCase() !== 'resolved' && inc.status?.toLowerCase() !== 'rejected'
  ).length;
  const pendingReviews = incidents.filter(
    (inc) => inc.status?.toLowerCase() === 'pending review' || inc.status?.toLowerCase() === 'pending'
  ).length;
  const activeResponders = responders.filter(
    (resp) => resp.status?.toLowerCase() === 'on scene' || resp.status?.toLowerCase() === 'en route' || resp.status?.toLowerCase() === 'available'
  ).length;

  const cards = [
    {
      id: 'total',
      title: 'Total Incidents',
      count: totalIncidents,
      badgeText: 'All Reports',
      subtext: 'Ingested via offline mesh beacons',
      icon: 'incidents',
      variant: 'blue',
      filterType: 'all',
      isActive: activeFilter === 'all'
    },
    {
      id: 'critical',
      title: 'Critical Incidents',
      count: criticalIncidents,
      badgeText: 'Priority 1',
      subtext: 'Urgent action required',
      icon: 'alertTriangle',
      variant: 'critical',
      filterType: 'critical',
      isActive: activeFilter === 'critical',
      highlightPulse: criticalIncidents > 0
    },
    {
      id: 'pending',
      title: 'Pending Reviews',
      count: pendingReviews,
      badgeText: 'Coordinator Triage',
      subtext: 'Awaiting operator review',
      icon: 'clock',
      variant: 'amber',
      filterType: 'pending',
      isActive: activeFilter === 'pending'
    },
    {
      id: 'responders',
      title: 'Active Responders',
      count: activeResponders,
      badgeText: 'Mesh Connected',
      subtext: `${responders.filter(r => r.status === 'On Scene').length} on scene, ${responders.filter(r => r.status === 'En Route').length} en route`,
      icon: 'responders',
      variant: 'teal',
      filterType: 'responders-view',
      isActive: false
    }
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card) => {
        return (
          <div
            key={card.id}
            className={`summary-card card-${card.variant} ${card.isActive ? 'active-filter' : ''}`}
            onClick={() => onSelectFilter && onSelectFilter(card.filterType)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectFilter && onSelectFilter(card.filterType);
              }
            }}
          >
            <div className="summary-card-header">
              <span className="summary-card-title">{card.title}</span>
              <div className={`summary-icon-wrapper icon-${card.variant}`}>
                <Icon name={card.icon} size={18} />
              </div>
            </div>

            <div className="summary-card-body">
              <div className="summary-card-count-row">
                <span className="summary-card-count">{card.count}</span>
                <span className={`summary-card-badge badge-${card.variant}`}>
                  {card.badgeText}
                </span>
              </div>
              <p className="summary-card-subtext">{card.subtext}</p>
            </div>

            <div className="summary-card-footer">
              <span className="summary-card-hint">
                {card.filterType === 'responders-view' ? 'View deployed teams →' : 'Click to filter list →'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
