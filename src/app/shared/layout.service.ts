import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { PageLayoutComponent } from 'app/shared/page-layout.component';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { empty } from 'app/shared/helper';

const BREAKPOINTS = {
  xxs: '(max-width: 325px)',
  xs: '(min-width: 326px) and (max-width: 575px)',
  sm: '(min-width: 576px) and (max-width: 767px)',
  md: '(min-width: 768px) and (max-width: 991px)',
  lg: '(min-width: 992px) and (max-width: 1199px)',
  xl: '(min-width: 1200px)',

  'lt-xs': '(max-width: 325px)',
  'lt-sm': '(max-width: 575px)',
  'lt-md': '(max-width: 767px)',
  'lt-lg': '(max-width: 991px)',
  'lt-xl': '(max-width: 1199px)',

  'gt-xxs': '(min-width: 326px)',
  'gt-xs': '(min-width: 576px)',
  'gt-sm': '(min-width: 768px)',
  'gt-md': '(min-width: 992px)',
  'gt-lg': '(min-width: 1200px)'
};

/**
 * The existing breakpoints
 */
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Shared definitions for the application layout
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
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
      document.body.classList.add('pb-0');
    } else {
      document.body.classList.remove('pb-0');
    }
  }

  private activeBreakpoints = new Set<Breakpoint>();
  private breakpointObservers = new Map<Breakpoint, Observable<boolean>>();

  private _breakpointChanges = new BehaviorSubject<Set<Breakpoint>>(new Set());
  breakpointChanges$ = this._breakpointChanges.asObservable().pipe(distinctUntilChanged());

  private leftAreaVisibleSub: Subscription;

  constructor(observer: BreakpointObserver) {
    this.breakpointObservers = new Map();
    for (const name of Object.keys(BREAKPOINTS)) {
      const breakpoint = name as Breakpoint;
      if (!BREAKPOINTS.hasOwnProperty(breakpoint)) {
        continue;
      }
      const query = BREAKPOINTS[breakpoint];
      const breakpointObserver = observer.observe(query).pipe(
        map(res => res.matches),
        distinctUntilChanged()
      );
      this.breakpointObservers.set(breakpoint, breakpointObserver);
      // Observe any changes in active breakpoints
      breakpointObserver.subscribe(matches => {
        if (matches) {
          this.activeBreakpoints.add(breakpoint);
        } else {
          this.activeBreakpoints.delete(breakpoint);
        }
        this._breakpointChanges.next(new Set(this.activeBreakpoints));
      });
      // Set the initial state of the active breakpoints
      if (observer.isMatched(query)) {
        this.activeBreakpoints.add(breakpoint);
      }
    }
    this._breakpointChanges.next(this.activeBreakpoints);
    this._breakpointChanges.subscribe(activeBreakpoints => this.updateBodyStyles(activeBreakpoints));
    this.updateBodyStyles(this.activeBreakpoints);

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

  private updateBodyStyles(breakpoints: Set<string>) {
    if (!document) {
      return;
    }
    const classes = document.body.classList;
    for (const name in BREAKPOINTS) {
      if (!BREAKPOINTS.hasOwnProperty(name)) {
        continue;
      }
      if (breakpoints.has(name)) {
        classes.add(name);
      } else {
        classes.remove(name);
      }
    }
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
    // For larger screens we should return the container width
    return this.width;
  }

  get height(): number {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  }

  /**
   * Returns whether a specific breakpoint is active
   * @param name The breakpoint name
   */
  isActive(name: Breakpoint) {
    return this.activeBreakpoints.has(name);
  }

  get xxs(): boolean {
    return this.isActive('xxs');
  }
  get xs(): boolean {
    return this.isActive('xs');
  }
  get sm(): boolean {
    return this.isActive('sm');
  }
  get md(): boolean {
    return this.isActive('md');
  }
  get lg(): boolean {
    return this.isActive('lg');
  }
  get xl(): boolean {
    return this.isActive('xl');
  }

  get ltxs(): boolean {
    return this.isActive('lt-xs');
  }
  get ltsm(): boolean {
    return this.isActive('lt-sm');
  }
  get ltmd(): boolean {
    return this.isActive('lt-md');
  }
  get ltlg(): boolean {
    return this.isActive('lt-lg');
  }
  get ltxl(): boolean {
    return this.isActive('lt-xl');
  }

  get gtxxs(): boolean {
    return this.isActive('gt-xxs');
  }
  get gtxs(): boolean {
    return this.isActive('gt-xs');
  }
  get gtsm(): boolean {
    return this.isActive('gt-sm');
  }
  get gtmd(): boolean {
    return this.isActive('gt-md');
  }
  get gtlg(): boolean {
    return this.isActive('gt-lg');
  }

  /**
   * Returns an observable that notifies every time a breakpoint activation changes
   * @param name The breakpoint name
   */
  observeBreakpoint(name: Breakpoint): Observable<boolean> {
    return this.breakpointObservers.get(name);
  }

  get xxs$(): Observable<boolean> {
    return this.observeBreakpoint('xxs');
  }
  get xs$(): Observable<boolean> {
    return this.observeBreakpoint('xs');
  }
  get sm$(): Observable<boolean> {
    return this.observeBreakpoint('sm');
  }
  get md$(): Observable<boolean> {
    return this.observeBreakpoint('md');
  }
  get lg$(): Observable<boolean> {
    return this.observeBreakpoint('lg');
  }
  get xl$(): Observable<boolean> {
    return this.observeBreakpoint('xl');
  }

  get ltxs$(): Observable<boolean> {
    return this.observeBreakpoint('lt-xs');
  }
  get ltsm$(): Observable<boolean> {
    return this.observeBreakpoint('lt-sm');
  }
  get ltmd$(): Observable<boolean> {
    return this.observeBreakpoint('lt-md');
  }
  get ltlg$(): Observable<boolean> {
    return this.observeBreakpoint('lt-lg');
  }
  get ltxl$(): Observable<boolean> {
    return this.observeBreakpoint('lt-xl');
  }

  get gtxxs$(): Observable<boolean> {
    return this.observeBreakpoint('gt-xxs');
  }
  get gtxs$(): Observable<boolean> {
    return this.observeBreakpoint('gt-xs');
  }
  get gtsm$(): Observable<boolean> {
    return this.observeBreakpoint('gt-sm');
  }
  get gtmd$(): Observable<boolean> {
    return this.observeBreakpoint('gt-md');
  }
  get gtlg$(): Observable<boolean> {
    return this.observeBreakpoint('gt-lg');
  }

  /**
   * Returns whether an element allowed on a given set of breakpoints should be visible, given the active breakpoints.
   * @param allowedBreakpoints The breakpoints in which the element is visible. When null or empty, is always visible
   * @param activeBreakpoints The active breakpoints. If not passed in, gets the currently active breakpoints
   */
  visible(allowedBreakpoints: Breakpoint[], activeBreakpoints?: Set<Breakpoint>): boolean {
    if (empty(allowedBreakpoints)) {
      return true;
    }
    if (empty(activeBreakpoints)) {
      activeBreakpoints = this._breakpointChanges.value;
    }
    return allowedBreakpoints.find(b => activeBreakpoints.has(b)) != null;
  }

}
