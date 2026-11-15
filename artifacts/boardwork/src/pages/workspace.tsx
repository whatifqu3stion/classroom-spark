import { Route, Switch } from "wouter";
import { BoardworkProvider } from "@/store/boardwork-context";
import NotFound from "@/pages/not-found";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/home"));
const History = lazy(() => import("@/pages/history"));
const Present = lazy(() => import("@/pages/present"));
const Homebase = lazy(() => import("@/pages/homebase"));

export default function Workspace() {
  return (
    <BoardworkProvider>
      <Suspense fallback={<div role="status" className="p-8">Opening your workspace…</div>}>
        <Switch>
          <Route path="/homebase" component={Homebase} />
          <Route path="/app" component={Home} />
          <Route path="/activity/:id" component={Home} />
          <Route path="/history" component={History} />
          <Route path="/present/:id" component={Present} />
          <Route path="/present" component={Present} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </BoardworkProvider>
  );
}
