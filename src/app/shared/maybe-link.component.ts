import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { empty } from 'app/shared/helper';

/**
 * Shows either an anchor surrounding the content or the content itself if there's no link
 */
@Component({
  selector: 'maybe-link',
  templateUrl: 'maybe-link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaybeLinkComponent {
  @Input() link: string | string[];
  @Output() click = new EventEmitter<MouseEvent>();

  get hasLink() {
    return !empty(this.link);
  }
}
