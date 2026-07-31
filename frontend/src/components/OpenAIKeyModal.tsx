import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ShieldAlert, X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { saveUserCredentials, getUserCredentials } from '../services/vault';

interface OpenAIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customKey: string) => void;
}

export const OpenAIKeyModal: React.FC<OpenAIKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const existingCreds = getUserCredentials();
  const [apiKey, setApiKey] = useState<string>(existingCreds?.openaiApiKey || '');
  const [error, setError] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setError('Please enter a valid OpenAI API key');
      return;
    }
    if (!cleanKey.startsWith('sk-')) {
      setError('OpenAI API keys usually start with "sk-"');
      return;
    }

    saveUserCredentials({ openaiApiKey: cleanKey });
    setIsSaved(true);
    setError('');

    setTimeout(() => {
      onSuccess(cleanKey);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-md p-6 rounded-2xl border theme-border shadow-2xl backdrop-blur-2xl relative space-y-4"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-subtitle hover:text-title p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-title">System OpenAI Quota Exhausted</h3>
              <p className="text-xs text-subtitle">All 3 system API keys reached usage limit</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 leading-relaxed font-mono">
            ⚠️ System OpenAI keys have exceeded quota limits. Enter your personal OpenAI API Key to resume live GPT-4o incident diagnostics.
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-subtitle flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Your OpenAI API Key (`sk-...`)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-black/40 border theme-border focus:border-blue-500 focus:outline-none text-title placeholder:text-subtitle/50"
                autoFocus
              />
              {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-subtitle hover:text-title font-semibold rounded-xl card-bg-subtle border theme-border transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaved}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl shadow-md transition"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved! Resuming...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Key & Resume</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
