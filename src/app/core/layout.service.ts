import { Injectable, OnDestroy } from '@angular/core';
import { BreakPointRegistry, MediaChange, ObservableMedia } from '@angular/flex-layout';
import { Menu } from 'app/shared/menu';
import { Subscription, Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { MatDialogConfig } from '@angular/material';
import { PageLayoutComponent } from 'app/shared/page-layout.component';

/**
 * Shared definitions for the application layout
 */
@Injectable()
export class LayoutService implements OnDestroy {
  private mediaSubscription: Subscription;

  constructor(
    private media: ObservableMedia,
    private breakPoints: BreakPointRegistry
  ) {
    this.mediaSubscription = this.media.subscribe((change: MediaChange) => {
      this.updateStyles();
    });
    this.updateStyles();
  }

  /** The active menu */
  menu = new BehaviorSubject<Menu>(null);

  /** Whether the content takes the full available height */
  fullHeightContent = new BehaviorSubject(false);

  private pageLoaded = new Subject<PageLayoutComponent>();

  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  ngOnDestroy(): void {
    this.mediaSubscription.unsubscribe();
  }

  get darkTheme(): boolean {
    return localStorage.getItem('darkTheme') === 'true';
  }

  set darkTheme(darkTheme: boolean) {
    localStorage.setItem('darkTheme', String(darkTheme));
    const html = document.body.parentElement;
    if (html && html.classList) {
      if (darkTheme) {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.add('light');
        html.classList.remove('dark');
      }
    }
  }

  /**
   * Returns the text width, in pixels
   * @param text The text to measure
   */
  textWidth(text: string): number {
    return this.context2d.measureText(text).width;
  }

  private get context2d(): CanvasRenderingContext2D {
    if (this._canvas == null) {
      this._canvas = document.createElement('canvas');
      this._canvas.style.width = '0px';
      this._canvas.style.height = '0px';
      this._canvas.style.visibility = 'hidden';
      document.body.appendChild(this._canvas);
      this._ctx = this._canvas.getContext('2d');
      const bodyStyle = window.getComputedStyle(document.body);
      this._ctx.font = bodyStyle.font;
    }
    return this._ctx;
  }

  private updateStyles(): void {
    const body = document.body;
    // Update the light / dark theme style
    this.darkTheme = this.darkTheme;
    // Now apply the classes for each media query breakpoint
    for (const breakPoint of this.breakPoints.items) {
      if (this.media.isActive(breakPoint.alias)) {
        body.classList.add(breakPoint.alias);
      } else {
        body.classList.remove(breakPoint.alias);
      }
    }
  }

  get xs(): boolean {
    return this.media.isActive('xs');
  }
  get sm(): boolean {
    return this.media.isActive('sm');
  }
  get md(): boolean {
    return this.media.isActive('md');
  }
  get lg(): boolean {
    return this.media.isActive('lg');
  }
  get xl(): boolean {
    return this.media.isActive('xl');
  }

  get ltsm(): boolean {
    return this.media.isActive('lt-sm');
  }
  get ltmd(): boolean {
    return this.media.isActive('lt-md');
  }
  get ltlg(): boolean {
    return this.media.isActive('lt-lg');
  }
  get ltxl(): boolean {
    return this.media.isActive('lt-xl');
  }

  get gtxs(): boolean {
    return this.media.isActive('gt-xs');
  }
  get gtsm(): boolean {
    return this.media.isActive('gt-sm');
  }
  get gtmd(): boolean {
    return this.media.isActive('gt-md');
  }
  get gtlg(): boolean {
    return this.media.isActive('gt-lg');
  }

  /**
   * Returns the document width, in pixels
   */
  get width(): number {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  }

  /**
   * Returns the content area width, in pixels
   */
  get contentWidth(): number {
    if (this.ltmd) {
      // For xs and sm sizes, the full width is available
      return this.width;
    }
    const elements = document.getElementsByClassName('content-wrapper');
    if (elements.length === 0) {
      // Not in a page layout
      return this.width;
    } else {
      return elements.item(0).clientWidth;
    }
  }

  get height(): number {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  }

  /**
   * Returns options suitable to be used as MatDialogConfig for opening popup forms
   * @param data The data to be passed to the form
   */
  formDialogConfig(data: any = null): MatDialogConfig<any> {
    return {
      data: data,
      width: this.xs ? '90%' : '600px',
      disableClose: true,
      autoFocus: false
    };
  }

  /**
   * Adds a new observer notified when a page layout was loaded
   */
  subscribeForPageLoaded(observer: (PageLayoutComponent) => void, err?: (any) => void, complete?: () => void): any {
    return this.pageLoaded.subscribe(observer, err, complete);
  }

  /**
   * Notifies that a page was loaded
   * @param page The loaded page
   */
  nextLoadedPage(page: PageLayoutComponent) {
    this.pageLoaded.next(page);
    this.fullHeightContent.next(false);
  }

}
