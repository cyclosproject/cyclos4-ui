import { MenuEntry } from 'app/ui/shared/menu';

export interface QuickAccessAction {
  icon: string;
  label: string;
  entry: MenuEntry;
  onClick?: () => void;
}