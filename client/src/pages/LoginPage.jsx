import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../auth/useAuth.js";

export default function LoginPage() {
  const {
    user,
    authLoading,
    login,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  if (authLoading) {
    return (
      <main className="page-container">
        <p>Loading session...</p>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/setup" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setLoginError(
        "Username and password are required.",
      );

      return;
    }

    try {
      setLoginLoading(true);
      setLoginError("");

      await login(normalizedUsername, password);

      const destination =
        location.state?.from?.pathname ?? "/setup";

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <main className="page-container">
      <section className="form-card">
        <h1>Login</h1>

        <p>
          Sign in to view the network, play games, and appear in
          the ranking.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">
            Username
          </label>

          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            disabled={loginLoading}
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            disabled={loginLoading}
          />

          {loginError && (
            <p className="error-message">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}