import { SvgIcon } from 'app/core/svg-icon';
import { MenuEntry } from 'app/ui/shared/menu';

export interface QuickAccessAction {
  icon: SvgIcon;
  label: string;
  entry: MenuEntry;
  onClick?: () => void;
  url?: string;
}