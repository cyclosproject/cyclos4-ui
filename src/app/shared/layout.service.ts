import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, blank } from 'app/shared/helper';
import { PageLayoutComponent } from 'app/shared/page-layout.component';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { isEqual } from 'lodash';
import { FormatService } from 'app/core/format.service';
import { Title } from '@angular/platform-browser';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';

const DarkTheme = 'darkTheme';

/**
 * The available media query breakpoints.
 * Attention! If modified, adjust the `$grid-breakpoints` variable in `_definieions.scss` as well.
 */
const BREAKPOINTS = {
  xxs: '(max-width: 315px)',
  xs: '(min-width: 316px) and (max-width: 575px)',
  sm: '(min-width: 576px) and (max-width: 767px)',
  md: '(min-width: 768px) and (max-width: 991px)',
  lg: '(min-width: 992px) and (max-width: 1199px)',
  xl: '(min-width: 1200px)',

  'lt-xs': '(max-width: 315px)',
  'lt-sm': '(max-width: 575px)',
  'lt-md': '(max-width: 767px)',
  'lt-lg': '(max-width: 991px)',
  'lt-xl': '(max-width: 1199px)',

  'gt-xxs': '(min-width: 316px)',
  'gt-xs': '(min-width: 576px)',
  'gt-sm': '(min-width: 768px)',
  'gt-md': '(min-width: 992px)',
  'gt-lg': '(min-width: 1200px)'
};

/**
 * The existing breakpoints
 */
export type Breakpoint = keyof typeof BREAKPOINTS;
export const ALL_BREAKPOINTS = Object.keys(BREAKPOINTS) as Breakpoint[];

/**
 * Shared definitions for the application layout
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  _colors = new Map<string, string>();
  _colorsDark = new Map<string, string>();
  _fontUrl: string;

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

  private breakpointObservers = new Map<Breakpoint, Observable<boolean>>();

  private _activeBreakpoints: BehaviorSubject<Set<Breakpoint>>;
  breakpointChanges$: Observable<Set<Breakpoint>>;

  private leftAreaVisibleSub: Subscription;

  private backdrop: HTMLElement;
  private escHandler: any;

  constructor(
    private observer: BreakpointObserver,
    private format: FormatService,
    private title: Title,
    dataForUiHolder: DataForUiHolder) {

    // Initialize the theme from the local storage
    this.darkTheme = this.darkTheme;

    // Read some elements we'll need
    this.readStylesAndApplyWhenReady();

    this.breakpointObservers = new Map();
    // Set the initial state of the active breakpoints, and initialize the observers
    const initialBreakpoints = new Set<Breakpoint>();
    for (const breakpoint of ALL_BREAKPOINTS) {
      const query = BREAKPOINTS[breakpoint];
      const breakpointObserver = observer.observe(query).pipe(
        map(res => res.matches),
        distinctUntilChanged()
      );
      this.breakpointObservers.set(breakpoint, breakpointObserver);
      if (observer.isMatched(query)) {
        initialBreakpoints.add(breakpoint);
      }
    }

    // Initialize the active breakpoints behavior subject
    this._activeBreakpoints = new BehaviorSubject(initialBreakpoints);
    this.breakpointChanges$ = this._activeBreakpoints.asObservable().pipe(
      distinctUntilChanged()
    );
    this._activeBreakpoints.subscribe(activeBreakpoints => this.updateBodyStyles(activeBreakpoints));
    this.updateBodyStyles(initialBreakpoints);

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

    window.addEventListener('resize', () => this.updateWindowWidth(), false);
    setTimeout(() => this.updateWindowWidth(), 1);

    dataForUiHolder.subscribe(() => {
      this.applyThemeColor();
    });
  }

  updateWindowWidth() {
    document.body.style.setProperty('--window-width', document.documentElement.clientWidth + 'px');

    // Observe any changes in active breakpoints
    const active = this.activeBreakpoints;
    if (!isEqual(active, this._activeBreakpoints.value)) {
      this._activeBreakpoints.next(active);
    }
  }

  private updateBodyStyles(breakpoints: Set<Breakpoint>) {
    if (!document) {
      return;
    }
    const classes = document.body.classList;
    for (const breakpoint of ALL_BREAKPOINTS) {
      if (breakpoints.has(breakpoint as Breakpoint)) {
        classes.add(breakpoint);
      } else {
        classes.remove(breakpoint);
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

  get activeBreakpoints(): Set<Breakpoint> {
    const active = new Set<Breakpoint>();
    for (const breakpoint of ALL_BREAKPOINTS) {
      const query = BREAKPOINTS[breakpoint];
      if (this.observer.isMatched(query)) {
        active.add(breakpoint);
      }
    }
    return active;
  }

  /**
   * Returns whether a specific breakpoint is active
   * @param breakpoint The breakpoint
   */
  isActive(breakpoint: Breakpoint) {
    const query = BREAKPOINTS[breakpoint];
    return this.observer.isMatched(query);
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
   * @param breakpoint The breakpoint
   */
  observeBreakpoint(breakpoint: Breakpoint): Observable<boolean> {
    return this.breakpointObservers.get(breakpoint);
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
      activeBreakpoints = this._activeBreakpoints.value;
    }
    return allowedBreakpoints.find(b => activeBreakpoints.has(b)) != null;
  }


  /**
   * Sets the window title, followed by the application title from configuration
   */
  setTitle(title?: string) {
    if (title) {
      this.title.setTitle(`${title} - ${this.format.appTitle}`);
    } else {
      this.title.setTitle(this.format.appTitle);
    }
  }

  /**
   * Shows the backdrop, which is an absolutely positioned DIV that occupies the full screen.
   * @param closeHandler Function to be called when the backdrop is clicked or when the escape key is pressed
   */
  showBackdrop(closeHandler: () => void) {
    // First, remove and re-apply the ESC key handler
    this.removeBackdropEscHandler();
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHandler();
      }
    };
    document.body.addEventListener('keydown', this.escHandler, false);

    if (this.backdrop == null) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'backdrop';
      this.backdrop.addEventListener('click', closeHandler, true);
      document.body.appendChild(this.backdrop);
      document.body.classList.add('backdrop-visible');
    }
    setTimeout(() => this.backdrop.style.opacity = '1', 1);
  }

  /**
   * Hides the backdrop, if any
   */
  hideBackdrop() {
    this.removeBackdropEscHandler();
    if (this.backdrop != null) {
      this.backdrop.style.opacity = '';
      document.body.classList.remove('backdrop-visible');
      setTimeout(() => {
        this.backdrop.parentElement.removeChild(this.backdrop);
        this.backdrop = null;
      }, 300);
    }
  }

  private removeBackdropEscHandler() {
    if (this.escHandler) {
      document.body.removeEventListener('keydown', this.escHandler, false);
      this.escHandler = null;
    }
  }

  get darkTheme(): boolean {
    return String(localStorage.getItem(DarkTheme)) === 'true';
  }

  set darkTheme(dark: boolean) {
    localStorage.setItem(DarkTheme, String(dark));
    const classList = document.body.classList;
    classList.add('theme-transition');
    setTimeout(() => classList.remove('theme-transition'), 400);
    if (dark) {
      classList.add('dark');
    } else {
      classList.remove('dark');
    }
    this.applyThemeColor();
  }

  private readStylesAndApplyWhenReady() {
    const style = getComputedStyle(document.body);

    this._fontUrl = style.getPropertyValue('--font-import-url').trim();
    if (blank(this._fontUrl)) {
      // Styles are not available yet
      setTimeout(() => this.readStylesAndApplyWhenReady(), 100);
      return;
    }
    for (const name of ['primary', 'theme-color', 'chart-color']) {
      this._colors.set(name, style.getPropertyValue('--' + name).trim());
      this._colorsDark.set(name, style.getPropertyValue('--' + name + '-dark').trim());
    }
    this.applyFontImport();
    this.applyThemeColor();
  }

  /**
   * Returns the primary color
   */
  get primaryColor(): string {
    return this.getColor('primary');
  }

  /**
   * Returns the chart color
   */
  get chartColor(): string {
    return this.getColor('chart-color');
  }

  /**
   * Returns the theme color (used by some browsers to theme themselves)
   */
  get themeColor(): string {
    return this.getColor('theme-color');
  }

  private getColor(name: string) {
    const colors = this.darkTheme ? this._colorsDark : this._colors;
    return colors.get(name);
  }

  private applyThemeColor() {
    const themeColor = this.themeColor;
    if (empty(themeColor)) {
      return;
    }
    const id = 'themeColorMeta';
    let meta: HTMLMetaElement = document.getElementById(id) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.id = id;
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = this.themeColor;
  }

  private applyFontImport() {
    const url = this._fontUrl;
    if (empty(url)) {
      return;
    }

    const id = 'fontImportLink';
    let link: HTMLLinkElement = document.getElementById(id) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      link.href = url;
    } else if (link.href !== url) {
      link.href = url;
    }
  }
}
