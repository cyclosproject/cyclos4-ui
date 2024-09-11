import { Directive, ElementRef, Injector, OnDestroy, OnInit, Type } from '@angular/core';
import { ApiI18nService } from 'app/core/api-i18n.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { FormatService } from 'app/core/format.service';
import { Shortcut, ShortcutService } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { Subscription } from 'rxjs';

/**
 * Base class for any component
 */
@Directive()
export abstract class AbstractComponent implements OnInit, OnDestroy {
  // Exports for templates
  ApiHelper = ApiHelper;
  SvgIcon = SvgIcon;

  injector: Injector;
  i18n: I18n;
  apiI18n: ApiI18nService;
  dataForFrontendHolder: DataForFrontendHolder;
  format: FormatService;
  shortcut: ShortcutService;
  private elementRef: ElementRef;
  private operationalSubs: Subscription[] = [];
  private lifecycleSubs: Subscription[] = [];
  private shortcutSubs: Subscription[] = [];

  constructor(injector: Injector) {
    this.injector = injector;
    this.i18n = injector.get(I18nInjectionToken);
    this.apiI18n = injector.get(ApiI18nService);
    this.dataForFrontendHolder = injector.get(DataForFrontendHolder);
    this.format = injector.get(FormatService);
    this.shortcut = injector.get(ShortcutService);
    this.elementRef = injector.get(ElementRef as Type<ElementRef>);
  }

  get element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  protected addSub(sub: Subscription, lifeCycle = false) {
    if (lifeCycle) {
      this.lifecycleSubs.push(sub);
    } else {
      this.operationalSubs.push(sub);
    }
  }

  /**
   * Adds a keyboard shortcut handler
   * @param shortcut The keyboard shortcut(s)
   * @param handler The action handler
   * @param stop By default, the event will be stopped if matched the shortcut. Can be set to false to allow the default action.
   */
  addShortcut(
    shortcut: string | Shortcut | (string | Shortcut)[],
    handler: (event: KeyboardEvent) => any,
    stop = true
  ): Subscription {
    const sub = this.shortcut.subscribe(shortcut, handler, stop);
    this.shortcutSubs.push(sub);
    return new Subscription(() => {
      sub.unsubscribe();
      const index = this.shortcutSubs.indexOf(sub);
      if (index >= 0) {
        this.shortcutSubs.splice(index, 1);
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.unsubscribe(false);
    this.unsubscribe(true);
    this.clearShortcuts();
  }

  protected unsubscribe(lifeCycle = true) {
    if (lifeCycle) {
      this.lifecycleSubs.forEach(sub => sub.unsubscribe());
      this.lifecycleSubs = [];
    } else {
      this.operationalSubs.forEach(sub => sub.unsubscribe());
      this.operationalSubs = [];
    }
  }

  clearShortcuts() {
    this.shortcutSubs.forEach(sub => sub.unsubscribe());
    this.shortcutSubs = [];
  }
}
