import React, { useState, useEffect } from 'react';
import { Shield, X, Check, FileText, Trash2, RefreshCcw } from 'lucide-react';
import { recordConsent, withdrawConsent, getConsentStatus, fetchDiversityPolicy } from '../../services/api';

interface DPDPConsentBannerProps {
  sessionId: string;
  onConsentUpdate?: (hasConsent: boolean) => void;
}

export const DPDPConsentBanner: React.FC<DPDPConsentBannerProps> = ({ sessionId, onConsentUpdate }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [consentStatus, setConsentStatus] = useState<{ has_consent: boolean; consent: any }>({ has_consent: false, consent: null });
  const [diversityPolicy, setDiversityPolicy] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(`dpdp_dismissed_${sessionId}`);
    if (!dismissed) {
      setVisible(true);
    }
    fetchConsentStatus();
    fetchDiversityPolicy();
  }, [sessionId]);

  const fetchConsentStatus = async () => {
    try {
      const data = await getConsentStatus(sessionId);
      setConsentStatus({ has_consent: data.has_consent ?? false, consent: data.consent ?? null });
      if (data.has_consent) {
        onConsentUpdate?.(true);
      }
    } catch (err) {
      console.warn('Consent status fetch failed', err);
    }
  };

  const fetchDiversityPolicy = async () => {
    try {
      const data = await fetchDiversityPolicy();
      setDiversityPolicy(data);
    } catch (err) {
      console.warn('Diversity policy fetch failed', err);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const data = await recordConsent(sessionId, true, '1.0');
      setConsentStatus({ has_consent: true, consent: (data as any).data });
      onConsentUpdate?.(true);
      showToast('Consent recorded. You can withdraw anytime.');
      setVisible(false);
      localStorage.setItem(`dpdp_dismissed_${sessionId}`, 'true');
    } catch (err) {
      console.warn('Consent recording failed', err);
      showToast('Failed to record consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const data = await recordConsent(sessionId, false, '1.0');
      setConsentStatus({ has_consent: false, consent: (data as any).data });
      onConsentUpdate?.(false);
      showToast('Consent declined. Limited personalization will be provided.');
      setVisible(false);
      localStorage.setItem(`dpdp_dismissed_${sessionId}`, 'true');
    } catch (err) {
      console.warn('Consent recording failed', err);
      showToast('Failed to record preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawConsent = async () => {
    setLoading(true);
    try {
      const data = await withdrawConsent(sessionId);
      setConsentStatus({ has_consent: false, consent: null });
      onConsentUpdate?.(false);
      showToast('Consent withdrawn. Your data has been anonymized.');
    } catch (err) {
      console.warn('Consent withdrawal failed', err);
      showToast('Failed to withdraw consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataAccess = async () => {
    setLoading(true);
    try {
      const data = await (await import('../../services/api')).requestDataAccess(sessionId);
      showToast(`Data export ready. Request ID: ${(data as any).data?.request_id ?? 'N/A'}`);
    } catch (err) {
      console.warn('Data access request failed', err);
      showToast('Failed to request data access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    setLoading(true);
    try {
      const data = await (await import('../../services/api')).requestDataDeletion(sessionId);
      showToast(`Data deletion processed. Request ID: ${(data as any).data?.request_id ?? 'N/A'}`);
      setConsentStatus({ has_consent: false, consent: null });
    } catch (err) {
      console.warn('Data deletion request failed', err);
      showToast('Failed to request data deletion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  if (!visible && !showPrivacyPanel) {
    return null;
  }

  return (
    <>
      {/* Consent Banner */}
      {visible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Privacy & Data Protection</h3>
                  <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                    ALGUD AI respects your privacy under DPDP guidelines. We use your data to provide personalized recommendations, 
                    AI shopping assistance, and analytics. No single product category will exceed 35% of any recommendation result set. 
                    You can withdraw consent or request data access/deletion at any time.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDecline}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Accept</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Panel (for consent withdrawal and data rights) */}
      {showPrivacyPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold text-gray-900">Privacy & Data Rights</h3>
              </div>
              <button onClick={() => setShowPrivacyPanel(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-bold text-gray-900 mb-1">Category Diversity Policy</h4>
                <p className="text-xs text-gray-600">
                  No single product category exceeds 35% of any recommendation, search, or AI assistant result set. 
                  Overshoot items are replaced with next-best candidates from under-represented categories.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900">Data Subject Rights</h4>
                <button
                  onClick={handleDataAccess}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Request Data Export
                </button>
                <button
                  onClick={handleDataDeletion}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Request Data Deletion
                </button>
                <button
                  onClick={handleWithdrawConsent}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Withdraw Consent & Anonymize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
};