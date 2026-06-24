import { json } from '@sveltejs/kit';

// Liveness/readiness probe for Kubernetes (T-10). No auth, no DB — must stay cheap
// so a slow/unavailable database never flaps the pod. See infra/k8s/.
export const GET = () => json({ ok: true });

// Probes only need GET; this route must not run hooks that touch the session/DB,
// but it is intentionally trivial so it always responds 200 while the pod is up.
export const prerender = false;
