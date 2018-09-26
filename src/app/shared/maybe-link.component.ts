import { Component, ChangeDetectionStrategy, Input, ElementRef, OnInit, HostBinding } from '@angular/core';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';
import { empty } from 'app/shared/helper';

// Use the require method provided by webpack
declare const require;

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

  get hasLink() {
    return !empty(this.link);
  }
}
