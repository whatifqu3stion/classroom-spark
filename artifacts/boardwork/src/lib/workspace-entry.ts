export const repositoryUrl =
  "https://github.com/whatifqu3stion/classroom-spark";
export const workspaceSetupUrl = `${repositoryUrl}/blob/feat/classroom-homebase/docs/STANDALONE.md`;

export function getWorkspaceEntry(
  isPublicSite: boolean,
  workspaceUrl?: string,
) {
  if (!isPublicSite) return { href: "/app", external: false, available: true };

  const href = workspaceUrl?.trim();
  if (href) {
    try {
      const url = new URL(href);
      if (url.protocol === "https:" && !url.username && !url.password) {
        return { href: url.href, external: true, available: true };
      }
    } catch {
      // An unset or invalid deployment address should lead to setup, not a dead link.
    }
  }

  return { href: workspaceSetupUrl, external: true, available: false };
}
