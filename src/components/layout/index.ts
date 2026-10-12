export { AppLayout } from './AppLayout';
export type { AppLayoutProps } from './AppLayout';
// ComposerModal is deliberately not re-exported: it carries Framer Motion through Modal,
// and only the dashboard opens it. That page lazy-loads it on the first click instead.
export { FAB } from './FAB';
export type { FABProps } from './FAB';
export { Footer } from './Footer';
export { Header, HeaderLogo, HeaderNav, HeaderProfile, HeaderSearch } from './Header';
export type { HeaderProps } from './Header';
export { Sidebar } from './Sidebar';
export type { SidebarProps } from './Sidebar';
