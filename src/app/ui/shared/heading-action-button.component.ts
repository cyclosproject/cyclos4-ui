import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { blurIfClick, nextId } from 'app/shared/helper';

/**
 * Renders a single button for a heading action.
 * Can be used either from the toolbar or from the page heading.
 */
@Component({
  selector: 'heading-action-button',
  templateUrl: 'heading-action-button.component.html',
  styleUrls: ['heading-action-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingActionButtonComponent {

  blurIfClick = blurIfClick;
  id: string;
  dropdownMenuId: string;

  constructor() {
    this.id = nextId('action');
    this.dropdownMenuId = 'menu_' + this.id;
  }

  @Input() action: HeadingAction;

}
