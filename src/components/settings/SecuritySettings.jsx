import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Key, Shield, Copy, Eye, EyeOff, RefreshCw, Lock } from 'lucide-react';
import { useUserProfile } from '@/components/hooks/useUserProfile';
import { toast } from 'sonner';

export default function SecuritySettings() {
  const { profile, generateApiKey, revokeApiKey, toggle2FA, saving } = useUserProfile();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleCopyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key);
      toast.success('API key copied to clipboard');
    }
  };

  const handleGenerateKey = async () => {
    if (profile?.api_key) {
      const confirmed = window.confirm(
        'This will revoke your current API key. Are you sure you want to generate a new one?'
      );
      if (!confirmed) return;
    }
    await generateApiKey();
  };

  const handleRevokeKey = async () => {
    const confirmed = window.confirm(
      'This will permanently revoke your API key. You will need to generate a new one. Continue?'
    );
    if (confirmed) {
      await revokeApiKey();
    }
  };

  const handle2FAToggle = async () => {
    const enable = !profile?.two_factor_enabled;
    const confirmed = window.confirm(
      enable 
        ? 'Enable two-factor authentication for enhanced security?'
        : 'Disable two-factor authentication? This will reduce account security.'
    );
    if (confirmed) {
      await toggle2FA(enable);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // In production, this would call an API endpoint
    toast.info('Password change not yet implemented. Contact support.');
    setShowPasswordDialog(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
      {/* Password Management */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowPasswordDialog(true)}>
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="border-slate-700"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="border-slate-700"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="border-slate-700"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Management */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Use this key for CLI access and programmatic API calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.api_key ? (
            <>
              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={profile.api_key}
                      readOnly
                      className="font-mono border-slate-700 bg-slate-800"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyApiKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateKey}
                  disabled={saving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Key
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRevokeKey}
                  disabled={saving}
                >
                  Revoke Key
                </Button>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-400">
                  <strong>Warning:</strong> Keep your API key secure. Do not share it or commit it to version control.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No API key generated yet</p>
              <Button onClick={handleGenerateKey} disabled={saving}>
                <Key className="w-4 h-4 mr-2" />
                Generate API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-slate-400">
                {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Badge variant={profile?.two_factor_enabled ? 'default' : 'outline'}>
              {profile?.two_factor_enabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <Button
            type="button"
            variant={profile?.two_factor_enabled ? 'destructive' : 'default'}
            className="w-full mt-4"
            onClick={handle2FAToggle}
            disabled={saving}
          >
            {profile?.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
          </Button>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent login history</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.last_login ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last Login</span>
                <span>{new Date(profile.last_login).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">
              No recent activity recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-slate-900 border-red-900/20 border">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-1">Delete Account</h4>
              <p className="text-sm text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  const confirmed = window.confirm(
                    'Are you absolutely sure? This will permanently delete your account and all data. Type DELETE to confirm.'
                  );
                  if (confirmed) {
                    toast.error('Account deletion not yet implemented. Contact support.');
                  }
                }}
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}