import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';

/**
 * Component shown when the URL is not a recognized component
 */
@Component({
  selector: 'not-found',
  templateUrl: 'not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  SvgIcon = SvgIcon;

  constructor(@Inject(I18nInjectionToken) public i18n: I18n) {
  }
}
