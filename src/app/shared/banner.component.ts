import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { Banner } from 'app/content/banner';
import { CacheService } from 'app/core/cache.service';
import { LoginService } from 'app/core/login.service';
import { empty } from 'app/shared/helper';
import { Subscription } from 'rxjs';

/**
 * Shows a banner at a time, rotating after a given timeout
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'banner',
  templateUrl: 'banner.component.html',
  styleUrls: ['banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerComponent implements OnInit, OnDestroy {

  @HostBinding('class.with-card') withCard = true;

  @Input() banners: Banner[];
  private index = -1;
  private sub: Subscription;
  private timeoutId: any;

  constructor(
    private el: ElementRef,
    private login: LoginService,
    private cache: CacheService,
    private injector: Injector
  ) {
  }

  get element(): HTMLElement {
    return this.el.nativeElement;
  }

  ngOnInit() {
    this.showNextBanner();
  }

  ngOnDestroy() {
    this.unsubscribe();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private showNextBanner() {
    if (empty(this.banners)) {
      return;
    }
    this.index++;
    if (this.index >= this.banners.length) {
      this.index = 0;
    }
    const banner = this.banners[this.index];
    this.withCard = banner.showCard;

    this.sub = this.cache.get(`banner_${banner.id}`, () => {
      return banner.content.get({
        user: this.login.user,
        injector: this.injector
      });
    }).subscribe(html => {
      this.element.innerHTML = html;
      if (this.banners.length > 1) {
        // When there are multiple banners, show the next one after x seconds
        this.timeoutId = setTimeout(() => this.showNextBanner(), banner.seconds * 1000);
      }
    });
  }

  private unsubscribe() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }
}
