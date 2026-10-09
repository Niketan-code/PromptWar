import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Mic,
  MicOff,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Camera,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { submitReport } from '../../lib/api';
import { ReportCategory } from '../../../../shared/types';
import { CredibilityBadge } from '../../components/ui/CredibilityBadge';

export const ReportModal: React.FC = () => {
  const {
    reportModalOpen,
    setReportModalOpen,
    activeCity,
    reports,
    setReports,
  } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = useState<ReportCategory>('Safety');
  const [description, setDescription] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);

  if (!reportModalOpen) return null;

  const categories: Array<{ id: ReportCategory; label: string; icon: string; desc: string }> = [
    { id: 'Safety', label: 'Safety Concern', icon: '🛡️', desc: 'Harassment, dark alleys, unsafe corners' },
    { id: 'Accident', label: 'Accident Hotspot', icon: '💥', desc: 'Collision, skids, pedestrian hazards' },
    { id: 'Traffic', label: 'Traffic Jam', icon: '🚗', desc: 'Gridlock, broken signals, blocked turns' },
    { id: 'Cleanliness', label: 'Waste & Garbage', icon: '🗑️', desc: 'Overflowing bins, illegal dumping, odor' },
    { id: 'Pothole', label: 'Road Crater / Pothole', icon: '🕳️', desc: 'Damaged asphalt, open manhole' },
    { id: 'Lighting', label: 'Broken Streetlight', icon: '💡', desc: 'Unlit corridors, flickering poles' },
    { id: 'Other', label: 'Other Civic Issue', icon: '⚠️', desc: 'Water leak, stray animals, fallen trees' },
  ];

  // Voice recording via Web Speech API
  const handleToggleVoice = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please type your description.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      if (!description) setDescription(transcript);
      else setDescription(`${description} ${transcript}`);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('city', activeCity.id);
      formData.append('category', category);
      formData.append('description', description);
      // Coordinate with slight jitter around city center or pin
      formData.append('lat', String(activeCity.center.lat + (Math.random() - 0.5) * 0.01));
      formData.append('lng', String(activeCity.center.lng + (Math.random() - 0.5) * 0.01));
      if (voiceTranscript) formData.append('voiceTranscript', voiceTranscript);
      if (photoFile) formData.append('photo', photoFile);

      const created = await submitReport(formData);
      setSubmissionResult(created);
      // Prepend to active reports in store
      setReports([created, ...reports]);
      setStep(4); // Success step
    } catch (err: any) {
      alert(err.message || 'Failed to submit citizen report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReportModalOpen(false);
    setStep(1);
    setDescription('');
    setVoiceTranscript('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setSubmissionResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-lg rounded-3xl border border-pink-500/30 overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-pink-950/60 via-slate-900 to-[#141A2D] border-b border-pink-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
              Civic Engagement & Verification
            </span>
            <h2 className="text-base font-bold text-white font-heading">
              Submit Citizen Report — {activeCity.name}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] border-b border-white/5 text-[11px] font-bold">
          <span className={step >= 1 ? 'text-pink-400' : 'text-slate-500'}>1. Category</span>
          <span className="text-slate-600">→</span>
          <span className={step >= 2 ? 'text-pink-400' : 'text-slate-500'}>2. Details & Voice</span>
          <span className="text-slate-600">→</span>
          <span className={step >= 3 ? 'text-pink-400' : 'text-slate-500'}>3. Photo Evidence</span>
          <span className="text-slate-600">→</span>
          <span className={step >= 4 ? 'text-pink-400' : 'text-slate-500'}>4. Verification</span>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* STEP 1: Category Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white block">
                Select the incident category:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      category === c.id
                        ? 'bg-pink-500/20 border-pink-500/60 shadow-md shadow-pink-500/10'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{c.icon}</span>
                      <span className="text-xs font-bold text-white">{c.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Description & Voice Note */}
          {step === 2 && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Describe the problem:</span>
                <span className="text-[10px] text-slate-400">NLP pipeline auto-extracts severity & hints</span>
              </div>

              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Open crater pothole on left lane near station road junction. Water accumulated and two-wheelers are swerving..."
                className="w-full p-3 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 text-xs leading-relaxed"
              />

              {/* Voice Note Button */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleToggleVoice}
                    className={`p-3 rounded-xl transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30'
                    }`}
                    title="Speak to record description"
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <div>
                    <span className="font-bold text-white block">
                      {isRecording ? 'Listening now...' : 'Voice-to-Text Input'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Browser Web Speech API transcription
                    </span>
                  </div>
                </div>

                {voiceTranscript && (
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Transcribed ✓
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Photo Upload with EXIF Privacy Warning */}
          {step === 3 && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Attach Visual Evidence (Photo):</span>
                <span className="text-[10px] text-teal-400 font-bold">Privacy Guaranteed</span>
              </div>

              <div className="p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-400/50 transition-colors text-center cursor-pointer bg-white/[0.02]">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-file-input"
                />
                <label htmlFor="photo-file-input" className="cursor-pointer block">
                  {photoPreview ? (
                    <div className="space-y-2">
                      <img
                        src={photoPreview}
                        alt="Evidence preview"
                        className="max-h-40 mx-auto rounded-xl object-cover shadow-lg"
                      />
                      <span className="text-[11px] text-pink-300 block">Click to replace photo</span>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <Camera className="w-8 h-8 text-pink-400 mx-auto" />
                      <span className="text-xs font-bold text-white block">
                        Upload or Capture Photo Evidence
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        JPEG, PNG, WebP up to 5MB
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Privacy EXIF Stripping Note */}
              <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/30 text-[11px] text-teal-200 flex items-start gap-2">
                <Shield className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Safeguard:</strong> All EXIF camera metadata and raw GPS tags are stripped before saving to disk. Reports remain completely anonymous.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Verification Engine Results */}
          {step === 4 && submissionResult && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Report Successfully Registered!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  NLP analysis classified severity and verification score.
                </p>
              </div>

              {/* Classification Badges */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Classified Category:</span>
                  <span className="font-bold text-pink-400">{submissionResult.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Extracted Severity:</span>
                  <span className="font-bold text-white">{submissionResult.severity} / 5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Credibility Score:</span>
                  <CredibilityBadge
                    status={submissionResult.status}
                    credibility={submissionResult.credibility}
                  />
                </div>
                {submissionResult.cluster_id && (
                  <div className="pt-2 border-t border-white/5 text-[11px] text-teal-300">
                    📍 Merged with active incident cluster ({submissionResult.clusterSize || 2} corroborating reports within 200m).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          {step < 4 ? (
            <>
              <button
                disabled={step === 1}
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30"
              >
                Back
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as any)}
                  disabled={step === 2 && !description.trim()}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-500/20 disabled:opacity-40 transition-all"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !description.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{submitting ? 'Running NLP Pipeline...' : 'Submit & Verify'}</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
            >
              Done & View on Map
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
