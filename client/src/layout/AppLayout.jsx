import { useState } from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import useAuth from "../auth/useAuth.js";

export default function AppLayout() {
  const {
    user,
    authLoading,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    try {
      setLogoutLoading(true);
      setLogoutError("");

      await logout();
      navigate("/");
    } catch (err) {
      setLogoutError(err.message);
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink
          to="/"
          className="brand"
        >
          Last Race
        </NavLink>

        <nav className="main-navigation">
          <NavLink to="/">
            Instructions
          </NavLink>

          {!authLoading && user && (
            <>
              <NavLink to="/setup">
                Play
              </NavLink>

              <NavLink to="/ranking">
                Ranking
              </NavLink>
            </>
          )}
        </nav>

        <div className="user-area">
          {!authLoading && user ? (
            <>
              <span>
                Signed in as <strong>{user.name}</strong>
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            !authLoading && (
              <NavLink to="/login">
                Login
              </NavLink>
            )
          )}
        </div>
      </header>

      {logoutError && (
        <p className="error-message">
          {logoutError}
        </p>
      )}

      <Outlet />
    </div>
  );
}