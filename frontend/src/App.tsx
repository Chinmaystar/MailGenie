import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import CampaignPage from "./pages/Campaign";
import Header from "./components/Header";

export type Route =
  | { page: "dashboard" }
  | { page: "campaign"; id: number };

function parseHash(): Route {
  const match = window.location.hash.match(/^#\/campaign\/(\d+)/);
  return match ? { page: "campaign", id: Number(match[1]) } : { page: "dashboard" };
}

function hashFor(route: Route): string {
  return route.page === "campaign" ? `#/campaign/${route.id}` : "#/";
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  // Keep the URL hash in sync so reload / back / forward stay on the same page.
  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: Route) => {
    const hash = hashFor(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    setRoute(next);
  };

  return (
    <div className="min-h-screen">
      <Header onHome={() => navigate({ page: "dashboard" })} />
      {route.page === "dashboard" ? (
        <Dashboard openCampaign={(id) => navigate({ page: "campaign", id })} />
      ) : (
        <CampaignPage
          id={route.id}
          onBack={() => navigate({ page: "dashboard" })}
        />
      )}
    </div>
  );
}
