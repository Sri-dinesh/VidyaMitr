'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Link2, 
  Copy, 
  CheckCircle2, 
  Settings, 
  ExternalLink,
  Zap,
  Shield
} from 'lucide-react';

/**
 * TASK 3: LMS Integration Architecture (UI Only)
 * Admin panel for managing LMS integrations (Canvas, Moodle, Google Classroom)
 */
export default function LMSIntegrationPanel() {
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateWebhook = () => {
    // Generate mock webhook URL
    const mockWebhookUrl = `https://api.vidyamitr.com/webhooks/lms/sync?token=${Math.random().toString(36).substring(2, 15)}`;
    setWebhookUrl(mockWebhookUrl);
    
    toast.success('LTI Webhook URL Generated!', {
      description: 'Copy this URL to your LMS integration settings',
      duration: 4000,
    });
  };

  const handleCopyWebhook = async () => {
    if (!webhookUrl) return;
    
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success('Webhook URL copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleToggleAutoSync = () => {
    setAutoSyncEnabled(!autoSyncEnabled);
    
    if (!autoSyncEnabled) {
      toast.success('Auto-Sync Grades Enabled', {
        description: 'Student grades will automatically sync to your LMS',
        duration: 3000,
      });
    } else {
      toast.info('Auto-Sync Grades Disabled', {
        description: 'Grades will need to be manually exported',
        duration: 3000,
      });
    }
  };

  const lmsProviders = [
    {
      name: 'Canvas LMS',
      icon: '🎨',
      description: 'Instructure Canvas integration',
      status: 'Available',
      color: 'bg-red-50 border-red-200',
    },
    {
      name: 'Moodle',
      icon: '📚',
      description: 'Open-source LMS integration',
      status: 'Available',
      color: 'bg-orange-50 border-orange-200',
    },
    {
      name: 'Google Classroom',
      icon: '🎓',
      description: 'Google Workspace for Education',
      status: 'Available',
      color: 'bg-blue-50 border-blue-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Integration Card */}
      <Card className="border-2 border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">LMS Integrations</CardTitle>
              <CardDescription className="text-base">
                Connect VidyaMitr with Canvas, Moodle, or Google Classroom
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* LMS Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lmsProviders.map((provider) => (
              <div
                key={provider.name}
                className={`p-4 rounded-lg border-2 ${provider.color} transition-all hover:shadow-md`}
              >
                <div className="text-3xl mb-2">{provider.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{provider.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {provider.status}
                </span>
              </div>
            ))}
          </div>

          {/* Webhook Generation Section */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">LTI Webhook Configuration</h3>
                <p className="text-sm text-gray-600">
                  Generate a secure webhook URL for LTI 1.3 integration with your LMS
                </p>
              </div>
            </div>

            {!webhookUrl ? (
              <Button 
                onClick={handleGenerateWebhook}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="w-5 h-5 mr-2" />
                Generate LTI Webhook URL
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white border-2 border-purple-200 rounded-lg">
                  <code className="flex-1 text-sm text-purple-700 font-mono break-all">
                    {webhookUrl}
                  </code>
                  <Button
                    onClick={handleCopyWebhook}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <strong>Security Note:</strong> This webhook URL contains a secure token. 
                    Keep it confidential and only share it with your LMS administrator.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Auto-Sync Toggle */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Auto-Sync Grades</h3>
                  <p className="text-sm text-gray-600">
                    Automatically synchronize student quiz scores and progress to your LMS gradebook
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleAutoSync}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                  ${autoSyncEnabled ? 'bg-green-600' : 'bg-gray-300'}
                `}
                role="switch"
                aria-checked={autoSyncEnabled}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                    ${autoSyncEnabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
            {autoSyncEnabled && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Auto-sync is active. Student grades will be pushed to your LMS every 15 minutes.
                </p>
              </div>
            )}
          </div>

          {/* Integration Documentation */}
          <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-indigo-600" />
              Integration Documentation
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold mt-0.5">•</span>
                <span>
                  <strong>Canvas:</strong> Navigate to Settings → Apps → Add App → Configure by URL
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold mt-0.5">•</span>
                <span>
                  <strong>Moodle:</strong> Site Administration → Plugins → External Tool → Manage Tools
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold mt-0.5">•</span>
                <span>
                  <strong>Google Classroom:</strong> Use the webhook URL in your Google Cloud Console
                </span>
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="mt-4 w-full border-indigo-300 hover:bg-indigo-100"
              onClick={() => {
                toast.info('Opening documentation...', {
                  description: 'Full integration guide will open in a new tab',
                });
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Integration Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
