// MOCK: Session user for dashboard/shell routes until better-auth session is wired.
// TODO(backend): Replace with session user from better-auth (M4-06).
import type { User } from '$lib/types/user';

export const mockUser: User = {
	id: 'user-alex',
	name: 'Alex Chen',
	initials: 'AC',
	planLabel: 'Pro plan'
};
