import { useAuth } from '@/components/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function UserProfile() {
  const { user, organization, role } = useAuth();

  if (!user) {
    return null; // Or a loading state
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400">Manage your personal settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1">
          <Card className="bg-slate-900 border-slate-800 text-center">
            <CardContent className="pt-6">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-slate-700">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.fullName} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-3xl">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-white">{user.fullName}</h2>
              <p className="text-slate-400">{user.email}</p>
              <div className="mt-2">
                <Badge variant="outline" className="capitalize bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {role}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
              <CardDescription className="text-slate-400">Update your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-400">Full Name</Label>
                <Input id="fullName" defaultValue={user.fullName} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled className="bg-slate-800 border-slate-700 cursor-not-allowed" />
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}