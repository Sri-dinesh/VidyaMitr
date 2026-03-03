'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Download, Share2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { getUserCertificates } from '@/app/actions/progress';
import Certificate from '@/components/Certificate';
import { toast } from 'sonner';
import type { Certificate as CertificateType } from '@/app/actions/progress';

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [certificates, setCertificates] = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateType | null>(null);

  useEffect(() => {
    if (!user.id) {
      router.push('/login');
      return;
    }

    const fetchCertificates = async () => {
      setIsLoading(true);
      try {
        const certs = await getUserCertificates();
        setCertificates(certs);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        toast.error('Failed to load certificates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [user.id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-1/4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.back()} variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <Award className="w-10 h-10 text-yellow-500" />
                  Your Certificates
                </h1>
                <p className="text-gray-600 mt-1">
                  Celebrate your learning achievements
                </p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {certificates.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  No Certificates Yet
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Complete all resources in a learning path to earn your first certificate!
                </p>
                <Button onClick={() => router.push('/dashboard')} size="lg">
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <Card
                  key={cert.id}
                  className="border-2 border-amber-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCertificate(cert)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      {cert.subject}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Goal</p>
                      <p className="font-semibold text-gray-900">{cert.goal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Resources Completed</p>
                      <p className="font-semibold text-gray-900">{cert.resources_completed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Issued Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(cert.issued_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCertificate(cert);
                      }}
                      className="w-full gap-2"
                    >
                      <Award className="w-4 h-4" />
                      View Certificate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Back to Dashboard */}
          <div className="text-center pt-8">
            <Button onClick={() => router.push('/dashboard')} variant="outline" size="lg">
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <Certificate
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
}
