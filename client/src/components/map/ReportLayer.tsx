import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { getReports, confirmReport } from '../../lib/api';

interface Props {
  map: L.Map;
}

const CATEGORY_ICONS: Record<string, string> = {
  Safety: '🛡️',
  Accident: '💥',
  Traffic: '🚗',
  Cleanliness: '🗑️',
  Pothole: '🕳️',
  Lighting: '💡',
  Other: '⚠️',
};

export const ReportLayer: React.FC<Props> = ({ map }) => {
  const { activeCity, reports, setReports } = useAppStore();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Fetch reports on city change
  useEffect(() => {
    getReports(activeCity.id)
      .then((data) => {
        if (data && data.reports) {
          setReports(data.reports, data.clusters);
        }
      })
      .catch(console.error);
  }, [activeCity]);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    reports.forEach((report) => {
      const iconGlyph = CATEGORY_ICONS[report.category] || '⚠️';
      const isVerified = report.status === 'verified';
      const isLikely = report.status === 'likely';

      const ringColor = isVerified ? '#10B981' : isLikely ? '#F59E0B' : '#94A3B8';

      const customIcon = L.divIcon({
        className: 'citizen-report-pin',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #141A2D;
            border: 2px solid ${ringColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            ${iconGlyph}
            ${
              report.upvotes > 0
                ? `<span style="
                    position: absolute;
                    top: -4px;
                    right: -6px;
                    background: #EC4899;
                    color: white;
                    font-size: 9px;
                    font-weight: bold;
                    padding: 1px 4px;
                    border-radius: 999px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                  ">+${report.upvotes}</span>`
                : ''
            }
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([report.lat, report.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; max-width: 240px; color: #E8ECF8;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: ${ringColor}; font-size: 13px;">${iconGlyph} ${report.category}</strong>
            <span style="font-size: 10px; color: #94A3B8; text-transform: uppercase;">${report.status} (${report.credibility}%)</span>
          </div>
          <p style="margin: 4px 0 8px 0; color: #CBD5E1; font-size: 11px; line-height: 1.4;">${report.description}</p>
          ${report.photoPath ? `<img src="${report.photoPath}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94A3B8;">
            <span>Severity: ${report.severity}/5</span>
            <span>Upvotes: ${report.upvotes}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(group);
    });

    return () => {
      group.clearLayers();
    };
  }, [reports, map]);

  return null;
};
