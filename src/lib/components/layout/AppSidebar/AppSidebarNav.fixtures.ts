import type { AppSidebarNavItemData } from './AppSidebarNav.types';

/** Default sidebar nav labels from design lines 41–45. */
export const defaultSidebarNavItems: AppSidebarNavItemData[] = [
	{ id: 'home', label: 'Home', icon: 'home', active: true, disabled: true },
	{ id: 'projects', label: 'All projects', icon: 'projects', disabled: true },
	{ id: 'templates', label: 'Templates', icon: 'templates', disabled: true },
	{ id: 'trash', label: 'Trash', icon: 'trash', disabled: true }
];
