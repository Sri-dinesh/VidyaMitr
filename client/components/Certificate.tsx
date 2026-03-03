'use client';

import { motion } from 'framer-motion';
import { Award, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Certificate as CertificateType } from '@/app/actions/progress';

interface CertificateProps {
  certificate: CertificateType;
  onClose?: () => void;
}

export default function Certificate({ certificate, onClose }: CertificateProps) {
  const { certificate_data, subject, goal, resources_completed, issued_date } = certificate;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    // Convert certificate to image using html2canvas
    const certificateElement = document.getElementById('certificate-content');
    if (!certificateElement) return;

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VidyaMitr-Certificate-${subject}-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      // Fallback to print
      handlePrint();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VidyaMitr Certificate of Completion',
          text: `I completed ${resources_completed} resources in ${subject}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Certificate Content */}
        <div
          id="certificate-content"
          className="bg-gradient-to-br from-amber-50 via-white to-blue-50 rounded-2xl shadow-2xl p-8 md:p-12 border-8 border-double border-amber-400"
        >
          {/* Decorative Corner Elements */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block mb-4"
            >
              <Award className="w-20 h-20 text-amber-500 mx-auto" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Certificate of Completion
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-amber-400 to-blue-500 mx-auto rounded-full" />
          </div>

          {/* Body */}
          <div className="text-center space-y-6 mb-8">
            <p className="text-lg text-gray-700">This is to certify that</p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-indigo-600 py-4 border-b-2 border-t-2 border-amber-300"
            >
              {certificate_data.student_name}
            </motion.h2>

            <p className="text-lg text-gray-700">
              has successfully completed the learning path for
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl p-6 border-2 border-indigo-300"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-2">
                {subject}
              </h3>
              <p className="text-lg text-indigo-600">{goal}</p>
              <p className="text-sm text-gray-600 mt-2">
                {certificate_data.grade_level}
              </p>
            </motion.div>

            <p className="text-lg text-gray-700">
              by completing{' '}
              <span className="font-bold text-indigo-600">{resources_completed}</span>{' '}
              educational resources with dedication and excellence.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end pt-8 border-t-2 border-amber-300">
            <div className="text-left">
              <p className="text-sm text-gray-600">Issued on</p>
              <p className="font-semibold text-gray-900">
                {certificate_data.completion_date}
              </p>
            </div>

            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-700">VidyaMitr Platform</p>
              <p className="text-xs text-gray-500">AI-Powered Learning</p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Certificate ID</p>
              <p className="font-mono text-xs text-gray-500">
                {certificate.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Award className="w-96 h-96 text-amber-500" />
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center mt-6 print:hidden"
        >
          <Button
            onClick={handleDownload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Print
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          {onClose && (
            <Button onClick={onClose} variant="ghost" className="text-gray-600">
              Close
            </Button>
          )}
        </motion.div>
      </motion.div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-content,
          #certificate-content * {
            visibility: visible;
          }
          #certificate-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
}
