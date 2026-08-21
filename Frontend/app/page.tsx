// Frontend\app\page.tsx

import { Dashboard } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
