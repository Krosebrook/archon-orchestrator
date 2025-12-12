import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Bell, Palette, Globe, Accessibility } from 'lucide-react';
import { useUserProfile } from '@/components/hooks/useUserProfile';

export default function PreferencesSettings() {
  const { preferences, loading, saving, updatePreferences } = useUserProfile();
  const [formData, setFormData] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    notification_preferences: {
      email_enabled: true,
      push_enabled: true,
      workflow_events: true,
      agent_events: true,
      approval_requests: true,
      security_alerts: true
    },
    accessibility: {
      reduced_motion: false,
      high_contrast: false,
      font_size: 'medium'
    }
  });

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updatePreferences(formData);
  };

  const updateNotification = (key, value) => {
    setFormData({
      ...formData,
      notification_preferences: {
        ...formData.notification_preferences,
        [key]: value
      }
    });
  };

  const updateAccessibility = (key, value) => {
    setFormData({
      ...formData,
      accessibility: {
        ...formData.accessibility,
        [key]: value
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Appearance */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how Archon looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => setFormData({ ...formData, theme: value })}
            >
              <SelectTrigger id="theme" className="border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Localization
          </CardTitle>
          <CardDescription>Language and regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger id="language" className="border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger id="timezone" className="border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_enabled">Email Notifications</Label>
              <p className="text-sm text-slate-400">Receive notifications via email</p>
            </div>
            <Switch
              id="email_enabled"
              checked={formData.notification_preferences.email_enabled}
              onCheckedChange={(checked) => updateNotification('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push_enabled">Push Notifications</Label>
              <p className="text-sm text-slate-400">Browser push notifications</p>
            </div>
            <Switch
              id="push_enabled"
              checked={formData.notification_preferences.push_enabled}
              onCheckedChange={(checked) => updateNotification('push_enabled', checked)}
            />
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-4">
            <Label className="text-sm font-medium">Event Types</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="workflow_events" className="font-normal">Workflow Events</Label>
              <Switch
                id="workflow_events"
                checked={formData.notification_preferences.workflow_events}
                onCheckedChange={(checked) => updateNotification('workflow_events', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="agent_events" className="font-normal">Agent Events</Label>
              <Switch
                id="agent_events"
                checked={formData.notification_preferences.agent_events}
                onCheckedChange={(checked) => updateNotification('agent_events', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="approval_requests" className="font-normal">Approval Requests</Label>
              <Switch
                id="approval_requests"
                checked={formData.notification_preferences.approval_requests}
                onCheckedChange={(checked) => updateNotification('approval_requests', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="security_alerts" className="font-normal">Security Alerts</Label>
              <Switch
                id="security_alerts"
                checked={formData.notification_preferences.security_alerts}
                onCheckedChange={(checked) => updateNotification('security_alerts', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="w-5 h-5" />
            Accessibility
          </CardTitle>
          <CardDescription>Adjust settings for better accessibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reduced_motion">Reduced Motion</Label>
              <p className="text-sm text-slate-400">Minimize animations and transitions</p>
            </div>
            <Switch
              id="reduced_motion"
              checked={formData.accessibility.reduced_motion}
              onCheckedChange={(checked) => updateAccessibility('reduced_motion', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="high_contrast">High Contrast</Label>
              <p className="text-sm text-slate-400">Increase color contrast</p>
            </div>
            <Switch
              id="high_contrast"
              checked={formData.accessibility.high_contrast}
              onCheckedChange={(checked) => updateAccessibility('high_contrast', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font_size">Font Size</Label>
            <Select
              value={formData.accessibility.font_size}
              onValueChange={(value) => updateAccessibility('font_size', value)}
            >
              <SelectTrigger id="font_size" className="border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="w-full md:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </form>
  );
}