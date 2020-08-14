/// <reference types="@types/googlemaps" />

import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { Breakpoint, LayoutService } from 'app/core/layout.service';
import { HeadingAction } from 'app/shared/action';
import { empty } from 'app/shared/helper';
import { ShortcutService } from 'app/core/shortcut.service';
import { Configuration } from 'app/ui/configuration';
import { BreakpointConfiguration } from 'app/ui/content/breakpoint-configuration';
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
export class UiLayoutService extends LayoutService {

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

  constructor(
    observer: BreakpointObserver,
    private titleRef: Title,
    shortcut: ShortcutService,
    dataForUiHolder: DataForUiHolder) {

    super(observer, shortcut, dataForUiHolder);

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
    if (title) {
      this.titleRef.setTitle(`${title} - ${this.appTitle}`);
    } else {
      this.titleRef.setTitle(this.appTitle);
    }
  }

  /**
   * Returns the application title
   */
  public get appTitle(): string {
    return Configuration.appTitle;
  }

  /**
   * Returns the application title for xs devices
   */
  public get appTitleSmall(): string {
    return Configuration.appTitleSmall || Configuration.appTitle;
  }

  /**
   * Returns the application title used inside the menu on small devices
   */
  public get appTitleMenu(): string {
    return Configuration.appTitleMenu || this.appTitle;
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
   * Either `Configuration.searchPageSizeXxs`, `Configuration.searchPageSizeXs` or `Configuration.searchPageSize`.
   */
  get searchPageSize(): number {
    if (this.xxs) {
      return Configuration.searchPageSizeXxs;
    } else if (this.xs) {
      return Configuration.searchPageSizeXs;
    } else {
      return Configuration.searchPageSize;
    }
  }

  get googleMapStyles(): google.maps.MapTypeStyle[] {
    return this.darkTheme ? DarkMapStyles : LightMapStyles;
  }

  /**
   * Returns a breakpoint configuration according to the given breakpoints.
   * If the set of breakpoints isn't passed in, assumes the currently active breakpoints.
   */
  getBreakpointConfiguration<K extends keyof BreakpointConfiguration>(key: K, breakpoints?: Set<Breakpoint>): BreakpointConfiguration[K] {
    const configs = Configuration.breakpoints;
    for (const bp of breakpoints || this.activeBreakpoints) {
      const config = configs[bp];
      if (config && config[key] != null) {
        return config[key];
      }
    }
  }
}
