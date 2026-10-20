import { Route, Switch } from "wouter";
import { BoardworkProvider } from "@/store/boardwork-context";
import Home from "@/pages/home";
import History from "@/pages/history";
import Present from "@/pages/present";
import NotFound from "@/pages/not-found";

export default function Workspace() {
  return (
    <BoardworkProvider>
      <Switch>
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
