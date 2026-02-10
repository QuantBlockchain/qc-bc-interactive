'use client';

import { useState, useRef } from 'react';
import { MessageSquarePlus, X, Send, Upload, Loader2, Trash2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { submitFeedback, getUploadUrl, FeedbackFile } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface PendingFile {
  file: File;
  uploading: boolean;
  uploaded: boolean;
  fileKey?: string;
  error?: string;
}

interface FeedbackButtonProps {
  sessionId?: string;
}

export function FeedbackButton({ sessionId }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`File ${file.name} is too large (max 10MB)`, 'error');
        return false;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast(`File type ${file.type} is not allowed`, 'error');
        return false;
      }
      return true;
    });

    const newPendingFiles: PendingFile[] = validFiles.map(file => ({
      file,
      uploading: false,
      uploaded: false,
    }));

    setFiles(prev => [...prev, ...newPendingFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (pendingFile: PendingFile, index: number): Promise<FeedbackFile | null> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, uploading: true, error: undefined } : f
      ));

      // Get presigned URL
      const { uploadUrl, fileKey } = await getUploadUrl(pendingFile.file.name, pendingFile.file.type);

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: pendingFile.file,
        headers: {
          'Content-Type': pendingFile.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Update status to uploaded
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, uploading: false, uploaded: true, fileKey } : f
      ));

      return {
        fileName: pendingFile.file.name,
        fileKey,
        fileSize: pendingFile.file.size,
        fileType: pendingFile.file.type,
      };
    } catch {
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, uploading: false, error: 'Upload failed' } : f
      ));
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!category || !message.trim()) {
      showToast('Please select a category and enter a message', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all files first
      const uploadedFiles: FeedbackFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const pendingFile = files[i];
        if (!pendingFile.uploaded) {
          const uploaded = await uploadFile(pendingFile, i);
          if (uploaded) {
            uploadedFiles.push(uploaded);
          }
        } else if (pendingFile.fileKey) {
          uploadedFiles.push({
            fileName: pendingFile.file.name,
            fileKey: pendingFile.fileKey,
            fileSize: pendingFile.file.size,
            fileType: pendingFile.file.type,
          });
        }
      }

      // Submit feedback
      await submitFeedback({
        name: name || undefined,
        email: email || undefined,
        category,
        message,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        sessionId,
      });

      showToast('Thank you for your feedback!', 'success');

      // Reset form
      setName('');
      setEmail('');
      setCategory('');
      setMessage('');
      setFiles([]);
      setIsOpen(false);
    } catch {
      showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          <div className="relative glass-effect rounded-xl md:rounded-2xl p-4 md:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold">Send Feedback</h2>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white focus:border-[#14b8a6] focus:outline-none transition-colors disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors resize-none disabled:opacity-50"
                  placeholder="Describe your feedback..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Attachments (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isSubmitting}
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-dashed border-gray-600 hover:border-[#14b8a6] transition-colors text-gray-400 hover:text-[#14b8a6] disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload files (max 10MB each)</span>
                </button>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map((f, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1f2937]/50 text-sm"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{f.file.name}</span>
                          {f.uploading && <Loader2 className="w-4 h-4 animate-spin text-[#14b8a6]" />}
                          {f.uploaded && <span className="text-green-400 text-xs">Uploaded</span>}
                          {f.error && <span className="text-red-400 text-xs">{f.error}</span>}
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting || f.uploading}
                          className="p-1 hover:bg-gray-700/50 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !category || !message.trim()}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
