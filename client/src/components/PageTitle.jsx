import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function getPageTitle(pathname) {
  if (pathname === "/") {
    return "Last Race | Instructions";
  }

  if (pathname === "/login") {
    return "Last Race | Login";
  }

  if (pathname === "/setup") {
    return "Last Race | Setup";
  }

  if (pathname === "/ranking") {
    return "Last Race | Ranking";
  }

  if (/^\/game\/\d+\/planning$/.test(pathname)) {
    return "Last Race | Planning";
  }

  if (/^\/game\/\d+\/execution$/.test(pathname)) {
    return "Last Race | Execution";
  }

  if (/^\/game\/\d+\/result$/.test(pathname)) {
    return "Last Race | Result";
  }

  return "Last Race";
}

export default function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  return null;
}