import { Directive, HostBinding, Injector, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'app/core/notification.service';
import { Enter, Escape, Shortcut, ShortcutService } from 'app/core/shortcut.service';
import { Subscription } from 'rxjs';
import { VoucherBaseComponent } from './voucher-base.component';

/**
 * Base class for all voucher pages.
 * New page components MUST extends this class to apply the right CSS styles
 * Subclasses overwriting the ngOnInit() method MUST invoke super.ngOnInit()
 */
@Directive()
export abstract class VoucherBasePageComponent extends VoucherBaseComponent implements OnInit, OnDestroy {
  @HostBinding('class.is-voucher-page') isVoucherPage = true;

  protected notification: NotificationService;
  protected shortcut: ShortcutService;
  protected router: Router;
  private shortcutSubs: Subscription[] = [];

  constructor(injector: Injector) {
    super(injector);
    this.notification = injector.get(NotificationService);
    this.shortcut = injector.get(ShortcutService);
    this.router = injector.get(Router);
  }

  get title() {
    return this.state.title;
  }

  set title(title: string) {
    this.state.title = title;
  }

  ngOnInit() {
    super.ngOnInit();
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

  addEscapeShortcut(handler: (event: KeyboardEvent) => any): Subscription {
    return this.addShortcut(Escape, handler);
  }

  addEnterShortcut(handler: (event: KeyboardEvent) => any): Subscription {
    return this.addShortcut(Enter, handler);
  }

  ngOnDestroy() {
    this.clearShortcuts();
  }

  clearShortcuts() {
    this.shortcutSubs.forEach(sub => sub.unsubscribe());
    this.shortcutSubs = [];
  }
}
