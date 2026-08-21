import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Present from '@/pages/present';
import History from '@/pages/history';
import { BoardworkProvider } from '@/store/boardwork-context';
import { PasswordGate } from '@/components/password-gate';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/activity/:id" component={Home} />
        <Route path="/history" component={History} />
        <Route path="/present/:id" component={Present} />
        <Route path="/present" component={Present} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/*
         * PasswordGate must wrap BoardworkProvider so the protected
         * /api/app-state query never fires before authentication succeeds.
         */}
        <PasswordGate>
          <BoardworkProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </BoardworkProvider>
        </PasswordGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;