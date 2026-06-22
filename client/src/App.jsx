import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "./layout/AppLayout.jsx";
import InstructionsPage from "./pages/InstructionsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RankingPage from "./pages/RankingPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";

import "./App.css";

import PlanningPage from "./pages/PlanningPage.jsx";

import ExecutionPage from "./pages/ExecutionPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";

import PageTitle from "./components/PageTitle.jsx";

export default function App() {
  return (
    <>
      <PageTitle />
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<InstructionsPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/setup"
              element={<SetupPage />}
            />

            <Route
              path="/ranking"
              element={<RankingPage />}
            />
          </Route>

            <Route
              path="/game/:gameId/planning"
              element={<PlanningPage />}
            />

            <Route
              path="/game/:gameId/execution"
              element={<ExecutionPage />}
            />

            <Route
              path="/game/:gameId/result"
              element={<ResultPage />}
            />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </>
  );
}