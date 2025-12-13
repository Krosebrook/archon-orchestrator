/**
 * @fileoverview Share Dialog Component
 * @module shared/ShareDialog
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

/**
 * Share dialog with public URL generation and QR code.
 * 
 * @example
 * <ShareDialog
 *   resourceType="workflow"
 *   resourceId={workflow.id}
 *   resourceName={workflow.name}
 * />
 */
export function ShareDialog({
  resourceType,
  resourceId,
  resourceName,
  onShare,
  trigger
}) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const shareUrl = `${window.location.origin}/share/${resourceType}/${resourceId}`;

  const handleTogglePublic = async (enabled) => {
    setIsPublic(enabled);
    
    if (enabled && !qrCode) {
      try {
        const qr = await QRCode.toDataURL(shareUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#1e293b', light: '#ffffff' }
        });
        setQrCode(qr);
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
    }

    onShare?.({ public: enabled, url: shareUrl });
    toast.success(enabled ? 'Public sharing enabled' : 'Public sharing disabled');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {resourceType}</DialogTitle>
          <DialogDescription>
            {resourceName && `Share "${resourceName}" with others`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Access</Label>
              <p className="text-sm text-slate-400">
                Anyone with the link can view
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
            />
          </div>

          {isPublic && (
            <>
              {/* Share URL */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm border-slate-700 bg-slate-800"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => window.open(shareUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {qrCode && (
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  <p className="text-xs text-slate-600">
                    Scan to open
                  </p>
                </div>
              )}

              {/* Embed code */}
              <div className="space-y-2">
                <Label>Embed Code</Label>
                <Input
                  value={`<iframe src="${shareUrl}" width="800" height="600"></iframe>`}
                  readOnly
                  className="font-mono text-xs border-slate-700 bg-slate-800"
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}