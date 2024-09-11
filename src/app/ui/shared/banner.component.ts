import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnInit } from '@angular/core';
import { FrontendBanner } from 'app/api/models';
import { blank, isSameOrigin } from 'app/shared/helper';

/**
 * Shows a card which displays a banner card with a (rotating) banner at a time
 */
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'banner',
  templateUrl: 'banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerComponent implements OnInit {
  @Input() banner: FrontendBanner;
  @HostBinding('class.mt-0') @Input() firstInLayout: boolean;

  content: string;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    const element: HTMLElement = this.elementRef.nativeElement;
    let content = this.banner.content;
    const url = this.banner.url;
    if (!blank(url)) {
      // The banner has a link
      let prefix = `<a class="undecorated" href="${url}"
        target="${this.banner.newWindow ? '_blank' : '_self'}"
        onclick="if (event.detail !== 0) this.blur();"`;
      if (isSameOrigin(url)) {
        // When clicking, just push the new state
        prefix += ` onclick="event.preventDefault(); history.pushState('${url}');"`;
      }
      content = `${prefix}>${content}</a>`;
    }
    this.content = content;

    if (!this.banner.themed) {
      element.innerHTML = content;
    }
  }
}
