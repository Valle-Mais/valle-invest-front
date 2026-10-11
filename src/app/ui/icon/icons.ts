import { Provider } from '@angular/core';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  FileText,
  Inbox,
  Info,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  LUCIDE_ICONS,
  LucideIconProvider,
  Mail,
  Menu,
  Moon,
  Pencil,
  Plus,
  Power,
  ReceiptText,
  Send,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-angular';

/**
 * Ícones disponíveis no app. Só o que está aqui entra no bundle.
 * Uso: <lucide-icon name="users" [size]="18" />  (nome em kebab-case)
 * Para adicionar um ícone: importar de 'lucide-angular' e incluir no objeto.
 */
export const VL_ICONS = {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  FileText,
  Inbox,
  Info,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  Moon,
  Pencil,
  Plus,
  Power,
  ReceiptText,
  Send,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
  Wallet,
  X,
};

export type VlIconName =
  | 'arrow-down-to-line' | 'arrow-left-right' | 'arrow-up-from-line' | 'ban' | 'check'
  | 'chevron-left' | 'chevron-right' | 'circle-check' | 'circle-x' | 'eye' | 'eye-off'
  | 'file-text' | 'inbox' | 'info' | 'key-round' | 'landmark' | 'layout-dashboard'
  | 'loader-circle' | 'log-out' | 'mail' | 'menu' | 'moon' | 'pencil' | 'plus' | 'power'
  | 'receipt-text' | 'send' | 'sun' | 'trash-2' | 'trending-down' | 'trending-up'
  | 'triangle-alert' | 'user' | 'users' | 'wallet' | 'x';

export function provideVlIcons(): Provider {
  return { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(VL_ICONS) };
}
