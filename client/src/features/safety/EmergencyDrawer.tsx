import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Phone, Share2, Check, Hospital, Siren, Pill } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const EmergencyDrawer: React.FC = () => {
  const { emergencyDrawerOpen, setEmergencyDrawerOpen, emergencyFacilities, activeCity } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!emergencyDrawerOpen) return null;

  const handleShareLocation = () => {
    const locUrl = `https://www.google.com/maps?q=${activeCity.center.lat},${activeCity.center.lng}`;
    const shareText = `🚨 EMERGENCY ALERT: I am currently near ${activeCity.name} center. My live location link: ${locUrl}. Please check in on me.`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed top-14 right-0 bottom-0 w-full sm:w-[400px] glass-panel border-l border-red-500/30 z-40 flex flex-col overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-950/80 via-slate-900 to-[#141A2D] border-b border-red-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Emergency & SOS Hub
            </h2>
            <p className="text-[11px] text-red-300/80">Nearest First Responders in {activeCity.name}</p>
          </div>
        </div>

        <button
          onClick={() => setEmergencyDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* National Hotlines Quick Dial */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all text-center"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>Call 112 (National)</span>
          </a>
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all text-center"
          >
            <Hospital className="w-4 h-4" />
            <span>Call 108 (Ambulance)</span>
          </a>
        </div>

        {/* Share Live Location Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <span className="text-[11px] font-bold text-slate-300 block">
            Instant Location Broadcast
          </span>
          <p className="text-[11px] text-slate-400">
            One-tap copy pre-formatted emergency SMS/WhatsApp text with your coordinates:
          </p>
          <button
            onClick={handleShareLocation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-teal-400" />}
            <span>{copied ? 'Copied Location Text!' : 'Copy Emergency Share Text'}</span>
          </button>
        </div>

        {/* Nearest Facilities List */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Nearby Emergency Services
          </span>

          {emergencyFacilities.map((fac) => (
            <div
              key={fac.id}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {fac.type === 'police' ? (
                    <Siren className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  ) : fac.type === 'hospital' ? (
                    <Hospital className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Pill className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-white">{fac.name}</h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded">
                  {fac.distanceKm} km
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{fac.address || 'Central City Region'}</span>
                {fac.phone && (
                  <a
                    href={`tel:${fac.phone.split('/')[0].trim()}`}
                    className="text-teal-400 hover:underline font-bold"
                  >
                    {fac.phone}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
