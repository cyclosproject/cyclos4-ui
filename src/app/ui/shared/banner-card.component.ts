import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { BannerCard } from 'app/ui/content/banner-card';
import { BannerService } from 'app/ui/core/banner.service';
import { ContentService } from 'app/ui/core/content.service';
import { blank } from 'app/shared/helper';
import { Subscription } from 'rxjs';

/**
 * Shows a card which displays a banner card with a (rotating) banner at a time
 */
@Component({
  selector: 'banner-card',
  templateUrl: 'banner-card.component.html',
  styleUrls: ['banner-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCardComponent implements OnInit, OnDestroy {

  @Input() card: BannerCard;
  @HostBinding('class.mt-0') @Input() firstInLayout: boolean;

  private bannerSub: Subscription;
  private contentSub: Subscription;

  constructor(
    public bannerService: BannerService,
    public contentService: ContentService,
    private elementRef: ElementRef) {
  }

  ngOnInit() {
    this.bannerSub = this.bannerService.getCurrentBanner(this.card).subscribe(banner => {
      let routerLink: string | any[] = null;
      let externalUrl: string = null;
      if (!blank(banner.link)) {
        if (typeof banner.link === 'string') {
          if (banner.link.includes('//')) {
            // This is a full URL
            externalUrl = banner.link;
          }
        }
        if (externalUrl == null) {
          routerLink = banner.link;
        }
      }
      this.contentSub = this.contentService.get(banner).subscribe(content => {
        let pushState = false;
        let url: string = null;
        if (routerLink) {
          if (routerLink instanceof Array) {
            routerLink = routerLink.map(e => e == null ? '' : e.toString()).join('/');
          }
          pushState = true;
          url = routerLink;
        } else if (externalUrl) {
          url = externalUrl;
        }

        if (url) {
          let prefix = `<a href="${url}" target="${banner.linkTarget}"`;
          if (pushState) {
            prefix += ` onclick="event.preventDefault(); history.pushState('${url}');"`;
          }
          content = `${prefix}>${content}</a>`;
        }

        const element: HTMLElement = this.elementRef.nativeElement;
        element.innerHTML = content;
        if (this.contentSub) {
          this.contentSub.unsubscribe();
        }
      });
    });
  }

  ngOnDestroy() {
    this.bannerSub.unsubscribe();
  }
}
