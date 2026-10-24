import { Route, Switch } from "wouter";
import { BoardworkProvider } from "@/store/boardwork-context";
import Home from "@/pages/home";
import History from "@/pages/history";
import Present from "@/pages/present";
import NotFound from "@/pages/not-found";
import { lazy, Suspense } from "react";

const Homebase = lazy(() => import("@/pages/homebase"));

export default function Workspace() {
  return (
    <BoardworkProvider>
      <Switch>
        <Route path="/homebase">
          <Suspense
            fallback={
              <div role="status" className="p-8">
                Opening Homebase…
              </div>
            }
          >
            <Homebase />
          </Suspense>
        </Route>
        <Route path="/app" component={Home} />
        <Route path="/activity/:id" component={Home} />
        <Route path="/history" component={History} />
        <Route path="/present/:id" component={Present} />
        <Route path="/present" component={Present} />
        <Route component={NotFound} />
      </Switch>
    </BoardworkProvider>
  );
}
