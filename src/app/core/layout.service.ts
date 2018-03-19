import { Injectable, OnDestroy } from '@angular/core';
import { BreakPointRegistry, MediaChange, ObservableMedia } from '@angular/flex-layout';
import { Menu } from 'app/shared/menu';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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

  get width(): number {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  }

  get height(): number {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  }

}
