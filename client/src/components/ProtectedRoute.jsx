import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import useAuth from "../auth/useAuth.js";

export default function ProtectedRoute() {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <main>
        <p>Loading session...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}