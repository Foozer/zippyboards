import AppLayout from '@/components/layout/AppLayout'
import UserProfile from '@/components/auth/UserProfile'

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <UserProfile />
      </div>
    </AppLayout>
  )
} 