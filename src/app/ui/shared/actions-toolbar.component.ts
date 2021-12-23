import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick } from 'app/shared/helper';

/**
 * Shows heading actions in larger displays.
 * Needs to be explicitly added to pages.
 */
@Component({
  selector: 'actions-toolbar',
  templateUrl: 'actions-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsToolbarComponent extends BaseComponent {
  blurIfClick = blurIfClick;

  @Input() headingActions: HeadingAction[];

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  updateVisibility(actions: HeadingAction[]) {
    this.element.style.display = actions?.length === 0 ? 'none' : '';
  }
}
