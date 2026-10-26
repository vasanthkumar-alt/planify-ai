import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, ExternalLink, Calendar } from 'lucide-react';

interface EmailPreviewModalProps {
  emailId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  emailId,
  isOpen,
  onClose,
}) => {
  const [emailData, setEmailData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (emailId && isOpen) {
      setIsLoading(true);
      fetch(`/api/emails/${emailId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEmailData(data.email);
          }
        })
        .catch((err) => console.error('Failed to load email log:', err))
        .finally(() => setIsLoading(false));
    }
  }, [emailId, isOpen]);

  if (!isOpen || !emailId) return null;

  const handleCopyHtml = () => {
    if (emailData?.html_content) {
      navigator.clipboard.writeText(emailData.html_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Dispatched Email Audit Viewer</h3>
              <p className="text-xs text-slate-400">
                To: {emailData?.recipient_name} ({emailData?.recipient_email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Meta Info */}
        {emailData && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Subject:</span>
              <span className="text-white font-semibold">{emailData.subject}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Type: <strong className="text-blue-300">{emailData.email_type}</strong></span>
              <span>•</span>
              <span>Dispatched: {new Date(emailData.sent_at).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Email HTML Render Frame */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading email payload...</div>
          ) : emailData?.html_content ? (
            <div className="bg-white rounded-xl shadow-inner overflow-hidden border border-slate-700">
              <iframe
                title="Email Preview"
                srcDoc={emailData.html_content}
                className="w-full h-[520px] border-none"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              />
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">No email content available.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
