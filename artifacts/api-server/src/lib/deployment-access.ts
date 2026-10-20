/** An assertion, not authentication. Only set behind enforced deployment sign-in. */
export function deploymentAccessProtected(): boolean {
  return process.env.DEPLOYMENT_ACCESS_PROTECTED === "true";
}
