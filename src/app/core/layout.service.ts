import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { FrontendScreenSizeEnum } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { Escape, ShortcutService } from 'app/core/shortcut.service';
import { ElementReference, empty, htmlCollectionToArray } from 'app/shared/helper';
import { isEqual } from 'lodash-es';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export type Theme = 'light' | 'dark';
export const Themes: Theme[] = ['light', 'dark'];
const ThemeKey = 'theme';

const ColorVariables = [
  'primary', 'theme-color', 'body-color', 'border-color', 'text-muted',
];

/*
 * Attention! If modified, adjust the `$grid-breakpoints` variable in `_definitions.scss` as well.
 */
const xs = 316;
const sm = 576;
const md = 768;
const lg = 992;
const xl = 1200;

/**
 * The available media query breakpoints.
 */
const BREAKPOINTS = {
  xxs: `(max-width: ${xs - 1}px)`,
  xs: `(min-width: ${xs}px) and (max-width: ${sm - 1}px)`,
  sm: `(min-width: ${sm}px) and (max-width: ${md - 1}px)`,
  md: `(min-width: ${md}px) and (max-width: ${lg - 1}px)`,
  lg: `(min-width: ${lg}px) and (max-width: ${xl - 1}px)`,
  xl: `(min-width: ${xl}px)`,

  'lt-xs': `(max-width: ${xs - 1}px)`,
  'lt-sm': `(max-width: ${sm - 1}px)`,
  'lt-md': `(max-width: ${md - 1}px)`,
  'lt-lg': `(max-width: ${lg - 1}px)`,
  'lt-xl': `(max-width: ${xl - 1}px)`,

  'gt-xxs': `(min-width: ${xs}px)`,
  'gt-xs': `(min-width: ${sm}px)`,
  'gt-sm': `(min-width: ${md}px)`,
  'gt-md': `(min-width: ${lg}px)`,
  'gt-lg': `(min-width: ${xl}px)`,
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
  providedIn: 'root',
})
export class LayoutService {
  _colors = new Map<string, string>();
  _colorsDark = new Map<string, string>();
  _fontUrl: string;
  _focusTrap: ElementReference;

  get focusTrap(): ElementReference {
    return this._focusTrap || this.xxs ? this.modal : null;
  }

  private breakpointObservers = new Map<Breakpoint, Observable<boolean>>();

  private _activeBreakpoints: BehaviorSubject<Set<Breakpoint>>;
  breakpointChanges$: Observable<Set<Breakpoint>>;

  theme$ = new BehaviorSubject<Theme>(null);

  private backdropSub: Subscription;
  private backdrop: HTMLElement;
  private backdropCloseHandler: () => void;

  constructor(
    private observer: BreakpointObserver,
    private shortcut: ShortcutService,
    dataForFrontendHolder: DataForFrontendHolder) {

    // Initialize the theme from the local storage
    const theme = (localStorage.getItem(ThemeKey) || 'light') as Theme;
    this.setTheme(theme, false);

    // Read some elements we'll need
    this.readStylesAndApplyWhenReady();

    this.breakpointObservers = new Map();
    // Set the initial state of the active breakpoints, and initialize the observers
    const initialBreakpoints = new Set<Breakpoint>();
    for (const breakpoint of ALL_BREAKPOINTS) {
      const query = BREAKPOINTS[breakpoint];
      const breakpointObserver = observer.observe(query).pipe(
        map(res => res.matches),
        distinctUntilChanged(),
      );
      this.breakpointObservers.set(breakpoint, breakpointObserver);
      if (observer.isMatched(query)) {
        initialBreakpoints.add(breakpoint);
      }
    }

    // Initialize the active breakpoints behavior subject
    this._activeBreakpoints = new BehaviorSubject(initialBreakpoints);
    this.breakpointChanges$ = this._activeBreakpoints.asObservable().pipe(
      distinctUntilChanged(),
    );
    this._activeBreakpoints.subscribe(activeBreakpoints => this.updateBodyStyles(activeBreakpoints));
    this.updateBodyStyles(initialBreakpoints);

    window.addEventListener('resize', () => this.updateWindowWidth(), false);
    setTimeout(() => this.updateWindowWidth(), 1);

    dataForFrontendHolder.subscribe(() => {
      this.applyThemeColor();
    });
  }

  setFocusTrap(el: ElementReference) {
    this._focusTrap = el;
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
    if (breakpoints.has('lt-lg')) {
      classes.add('window-width');
    } else {
      classes.remove('window-width');
    }
    for (const breakpoint of ALL_BREAKPOINTS) {
      if (breakpoints.has(breakpoint)) {
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
   * Returns whether a modal dialog is currently being shown
   */
  get hasModal(): boolean {
    return !!this.modal;
  }

  /**
   * Returns a reference to the first modal element, if any
   */
  get modal(): HTMLElement {
    const modal = htmlCollectionToArray(document.getElementsByClassName('modal'));
    return modal.length === 0 ? null : modal[0];
  }


  /**
   * Shows the backdrop, which is an absolutely positioned DIV that occupies the full screen.
   * @param closeHandler Function to be called when the backdrop is clicked or when the escape key is pressed
   */
  showBackdrop(closeHandler?: () => void) {
    // Make sure to remove any previous backdrop data
    this.hideBackdrop(false);

    // Store this backdrop close handler
    this.backdropCloseHandler = closeHandler;

    // Subscribe for Esc key to close the backdrop
    this.backdropSub = this.shortcut.subscribe(Escape, () => {
      this.hideBackdrop();
    });

    // Create the backdrop element
    if (this.backdrop == null) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'backdrop';
      this.backdrop.addEventListener('click', () => this.hideBackdrop(), true);
      document.body.appendChild(this.backdrop);
      document.body.classList.add('backdrop-visible');
    }
    // Show the backdrop
    setTimeout(() => this.backdrop.style.opacity = '1', 1);
  }

  /**
   * Hides the backdrop, if any
   */
  hideBackdrop(awaitAnimation = true) {
    if (this.backdropSub) {
      this.backdropSub.unsubscribe();
      this.backdropSub = null;
    }
    if (this.backdrop != null) {
      this.backdrop.style.opacity = '';
      document.body.classList.remove('backdrop-visible');

      const doRemove = () => {
        if (this.backdrop != null) {
          this.backdrop.parentElement.removeChild(this.backdrop);
          this.backdrop = null;
        }
      };
      if (awaitAnimation) {
        setTimeout(doRemove, 300);
      } else {
        doRemove();
      }
    }
    if (this.backdropCloseHandler) {
      const h = this.backdropCloseHandler;
      this.backdropCloseHandler = null;
      h();
    }
  }

  get theme(): Theme {
    return this.theme$.value;
  }

  set theme(theme: Theme) {
    this.setTheme(theme);
  }

  get darkTheme(): boolean {
    return this.theme === 'dark';
  }
  set darkTheme(dark: boolean) {
    this.theme = dark ? 'dark' : 'light';
  }

  private setTheme(theme: Theme, updateStorage = true) {
    if (!Themes.includes(theme)) {
      return;
    }
    if (updateStorage) {
      localStorage.setItem(ThemeKey, theme);
    }
    this.theme$.next(theme);
    const classList = document.body.classList;

    // Prepare a transition class to make the color switch smooth
    classList.add('theme-transition');
    setTimeout(() => classList.remove('theme-transition'), 400);

    // Update the body classList
    for (const t of Themes) {
      if (theme === t) {
        classList.add(t);
      } else {
        classList.remove(t);
      }
    }

    // The theme color is a separated HTML tag
    this.applyThemeColor();
  }

  private readStylesAndApplyWhenReady() {
    const style = getComputedStyle(document.body);
    for (const name of ColorVariables) {
      this._colors.set(name, style.getPropertyValue('--' + name).trim());
      this._colorsDark.set(name, style.getPropertyValue('--' + name + '-dark').trim());
    }
    this.applyThemeColor();
  }

  /**
   * Returns the current API `FrontendScreenSizeEnum`.
   */
  get screenSize(): FrontendScreenSizeEnum {
    if (this.xxs) {
      return FrontendScreenSizeEnum.FEATURE;
    } else if (this.xs) {
      return FrontendScreenSizeEnum.MOBILE;
    } else if (this.md) {
      return FrontendScreenSizeEnum.TABLET;
    } else {
      return FrontendScreenSizeEnum.DESKTOP;
    }
  }

  /**
   * Returns the primary color
   */
  get primaryColor(): string {
    return this.getColor('primary');
  }

  /**
   * Returns the body color
   */
  get bodyColor(): string {
    return this.getColor('body-color');
  }

  /**
   * Returns the border color
   */
  get borderColor(): string {
    return this.getColor('border-color');
  }

  /**
   * Returns the text-muted color
   */
  get textMutedColor(): string {
    return this.getColor('text-muted');
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
}
