import type { User as AuthUser } from 'better-auth';
import { mockUser } from '$lib/mocks/user.mock';
import type { User } from '$lib/types/user';
import { deriveUserInitials } from '$lib/utils/user-initials';

// MOCK: Default plan label until billing/subscription API exists.
// TODO(backend): Replace with subscription tier from billing service (M4-06).
const DEFAULT_PLAN_LABEL = 'Free plan';

/** Map better-auth session user to the sidebar `User` shape; mock when unauthenticated. */
export function resolveSidebarUser(authUser?: AuthUser | null): User {
	if (!authUser) return mockUser;

	return {
		id: authUser.id,
		name: authUser.name,
		initials: deriveUserInitials(authUser.name),
		planLabel: DEFAULT_PLAN_LABEL
	};
}
