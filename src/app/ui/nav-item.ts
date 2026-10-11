import { VlIconName } from './icon/icons';

/** Item de navegação usado pelo AppShell (sidebar) e pelo BottomNav. */
export interface VlNavItem {
  label: string;
  /** Relativo à rota do layout (ex.: 'dashboard') ou absoluto ('/admin/clients'). */
  link: string;
  icon: VlIconName;
  exact?: boolean;
  /** Contador exibido ao lado do item (ex.: pendências). */
  badge?: number | null;
}
