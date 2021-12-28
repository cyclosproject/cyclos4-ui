/// <reference types="@types/googlemaps" />

import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FrontendBanner } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { LayoutService } from 'app/core/layout.service';
import { HeadingAction } from 'app/shared/action';
import { empty } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { DarkMapStyles, LightMapStyles } from 'app/ui/shared/google-map-styles';
import { PageLayoutComponent } from 'app/ui/shared/page-layout.component';
import { isEqual } from 'lodash-es';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Shared definitions for the application layout
 */
@Injectable({
  providedIn: 'root',
})
export class UiLayoutService {

  currentPage$ = new BehaviorSubject<BasePageComponent<any>>(null);
  get currentPage(): BasePageComponent<any> {
    return this.currentPage$.value;
  }
  set currentPage(page: BasePageComponent<any>) {
    this.currentPage$.next(page);
  }

  currentPageLayout$ = new BehaviorSubject<PageLayoutComponent>(null);
  get currentPageLayout(): PageLayoutComponent {
    return this.currentPageLayout$.value;
  }
  set currentPageLayout(pageLayout: PageLayoutComponent) {
    this.currentPageLayout$.next(pageLayout);
  }

  leftAreaVisible$ = new BehaviorSubject(false);
  get leftAreaVisible(): boolean {
    return this.leftAreaVisible$.value;
  }
  set leftAreaVisible(visible: boolean) {
    if (visible !== this.leftAreaVisible$.value) {
      this.leftAreaVisible$.next(visible);
    }
  }

  fullWidth$ = new BehaviorSubject<boolean>(null);
  get fullWidth(): boolean {
    return this.fullWidth$.value;
  }
  set fullWidth(fullWidth: boolean) {
    this.fullWidth$.next(fullWidth);
    if (fullWidth) {
      document.body.classList.add('full-width');
    } else {
      document.body.classList.remove('full-width');
    }
  }

  title$ = new BehaviorSubject<string>(null);

  headingActions$ = new BehaviorSubject<HeadingAction[]>([]);

  private leftAreaVisibleSub: Subscription;

  banners$ = new BehaviorSubject<FrontendBanner[]>([]);
  get banners(): FrontendBanner[] {
    return this.banners$.value;
  }
  set banners(banners: FrontendBanner[]) {
    this.banners$.next(banners);
  }

  constructor(
    private titleRef: Title,
    private layout: LayoutService,
    private dataForFrontendHolder: DataForFrontendHolder) {

    this.currentPageLayout$.subscribe(pageLayout => {
      if (this.leftAreaVisibleSub) {
        this.leftAreaVisibleSub.unsubscribe();
        this.leftAreaVisibleSub = null;
      }
      if (pageLayout) {
        this.leftAreaVisible = pageLayout.leftAreaVisible$.value;
        this.leftAreaVisibleSub = pageLayout.leftAreaVisible$.subscribe(visible => this.leftAreaVisible = visible);
      } else {
        this.leftAreaVisible = false;
      }
    });
  }


  get title(): string {
    return this.title$.value;
  }

  set title(title: string) {
    this.title$.next(title);
    const data = this.dataForFrontendHolder.dataForFrontend;
    const appTitle = (data || {}).title || '';
    if (title) {
      this.titleRef.setTitle(`${title} - ${appTitle}`);
    } else {
      this.titleRef.setTitle(appTitle);
    }
  }

  get headingActions(): HeadingAction[] {
    return this.headingActions$.value;
  }

  set headingActions(actions: HeadingAction[]) {
    if (empty(actions)) {
      actions = null;
    }
    if (!isEqual(actions, this.headingActions)) {
      this.headingActions$.next(actions);
    }
  }

  /**
   * Returns a page size according to the current layout size.
   */
  get searchPageSize(): number {
    if (this.layout.xxs) {
      return 10;
    } else if (this.layout.ltmd) {
      return 20;
    } else {
      return 40;
    }
  }

  get googleMapStyles(): google.maps.MapTypeStyle[] {
    return this.layout.darkTheme ? DarkMapStyles : LightMapStyles;
  }
}
