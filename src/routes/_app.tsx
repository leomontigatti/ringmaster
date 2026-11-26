import { Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import { passwordChangePath } from "#/components/app-nav.ts";
import { AppBreadcrumbs } from "#/components/app-breadcrumbs.tsx";
import { AppSidebar } from "#/components/app-sidebar.tsx";
import { serverAnswer, shownPath } from "#/components/save-failure.ts";
import { useSignOut } from "#/components/sign-in-provider.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { UserMenu } from "#/components/user-menu.tsx";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar.tsx";
import { TooltipProvider } from "#/components/ui/tooltip.tsx";
import { useSessionGuard } from "#/hooks/use-session-guard.ts";
import { startNewSession } from "#/lib/session-change.ts";
import { sidebarStartsOpen } from "#/lib/sidebar-state.ts";
import { getViewer } from "#/server/account.functions.ts";

// Every signed-in screen sits under this layout. A member who must still
// replace the starting password is held on the change-password screen.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const result = await getViewer();
    if (!result.ok) {
      // Signing in lands back on the page asked for.
      throw redirect({
        to: "/ingresar",
        search: { volver: location.href === "/" ? undefined : location.href },
      });
    }
    if (result.viewer.mustChangePassword && location.pathname !== passwordChangePath) {
      throw redirect({ to: passwordChangePath });
    }
    return { viewer: result.viewer };
  },
  loader: () => ({ sidebarOpen: sidebarStartsOpen() }),
  // A signed-in page holds the organization's data: the browser
  // keeps no copy, so Back after a sign-out cannot show it to the next person.
  headers: () => ({ "Cache-Control": "no-store" }),
  component: AppShell,
});

function AppShell() {
  const { viewer } = Route.useRouteContext();
  const { sidebarOpen } = Route.useLoaderData();
  const router = useRouter();
  const endSession = useSignOut();

  useSessionGuard(viewer.userId);

  async function signOut() {
    const signedOut = await serverAnswer("sign-out", shownPath(router), async () => {
      await endSession();
      return { ok: true as const };
    });
    if (signedOut !== null) {
      startNewSession("/ingresar");
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar viewer={viewer} />
        <SidebarInset className="min-w-0">
          <header className="flex items-center gap-2 border-b px-4 py-2">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="data-vertical:h-4 data-vertical:self-auto"
            />
            <AppBreadcrumbs />
            <div className="ml-auto flex items-center gap-1">
              <UserMenu viewer={viewer} onSignOut={() => void signOut()} />
            </div>
          </header>
          <div className="flex flex-1 flex-col p-6 *:has-data-[slot=empty]:flex-1">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
