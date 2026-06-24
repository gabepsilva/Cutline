export type AppSidebarNavIcon = 'home' | 'projects' | 'templates' | 'trash';

export interface AppSidebarNavItemData {
	id: string;
	label: string;
	icon: AppSidebarNavIcon;
	active?: boolean;
	href?: string;
	disabled?: boolean;
}
