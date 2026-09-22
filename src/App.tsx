import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { PageTransition, useScrollReset } from '@/lib/hooks';
import { AppShell } from '@/components/layout/AppShell';
import { PublicShell } from '@/components/layout/PublicShell';

// One lazy import per route. Wave 1 imported all 27 pages eagerly through a
// single App.tsx, so the landing page paid for the editor's whole dependency
// graph before it could paint.
const Landing = lazy(() => import('@/pages/Landing'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const Reset = lazy(() => import('@/pages/Reset'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Create = lazy(() => import('@/pages/Create'));
const Projects = lazy(() => import('@/pages/Projects'));
const Editor = lazy(() => import('@/pages/Editor'));
const Templates = lazy(() => import('@/pages/Templates'));
const Brands = lazy(() => import('@/pages/Brands'));
const Assets = lazy(() => import('@/pages/Assets'));
const Credits = lazy(() => import('@/pages/Credits'));
const Billing = lazy(() => import('@/pages/Billing'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  // Held until the first session check resolves: redirecting on `ready === false`
  // bounces every signed-in user through the login page on a hard refresh.
  if (!ready) return <RouteFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, ready } = useAuth();
  if (!ready) return <RouteFallback />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <RouteFallback />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="w-8 h-8 rounded-full border-2 border-gold-600/30 border-t-gold-400 animate-spin" />
    </div>
  );
}

export default function App() {
  useScrollReset();

  return (
    <PageTransition>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicShell>
                <Landing />
              </PublicShell>
            }
          />

          <Route
            path="/login"
            element={
              <GuestOnly>
                <PublicShell>
                  <AuthPage mode="login" />
                </PublicShell>
              </GuestOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestOnly>
                <PublicShell>
                  <AuthPage mode="signup" />
                </PublicShell>
              </GuestOnly>
            }
          />
          <Route
            path="/reset"
            element={
              <PublicShell>
                <Reset />
              </PublicShell>
            }
          />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="create" element={<Create />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<Editor />} />
            <Route path="templates" element={<Templates />} />
            <Route path="brands" element={<Brands />} />
            <Route path="assets" element={<Assets />} />
            <Route path="credits" element={<Credits />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
          </Route>

          <Route
            path="*"
            element={
              <PublicShell>
                <NotFound />
              </PublicShell>
            }
          />
        </Routes>
      </Suspense>
    </PageTransition>
  );
}

const Admin = lazy(() => import('@/pages/Admin'));
