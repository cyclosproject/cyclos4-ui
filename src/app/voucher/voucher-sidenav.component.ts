import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActionsLeft, ActionsRight, ArrowsVertical, ShortcutService } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { handleKeyboardFocus } from 'app/shared/helper';
import { VoucherBaseComponent } from 'app/voucher/voucher-base.component';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * The sidenav contains the menu on small devices
 */
@Component({
  selector: 'voucher-sidenav',
  templateUrl: 'voucher-sidenav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherSidenavComponent extends VoucherBaseComponent implements OnInit {
  SvgIcon = SvgIcon;
  @HostBinding('class.has-top-bar') hasTopBar = true;
  @HostBinding('class.is-sidenav') isSidenav = true;

  @ViewChild('sidenavMenu', { static: true }) sidenavMenu: ElementRef;

  constructor(private _element: ElementRef, private shortcut: ShortcutService, injector: Injector) {
    super(injector);
  }

  private openSubs: Subscription[] = [];

  opened$ = new BehaviorSubject(false);

  get opened(): boolean {
    return this.opened$.value;
  }
  set opened(opened: boolean) {
    this.opened$.next(opened);
  }

  ngOnInit() {
    super.ngOnInit();
    this.layout.gtsm$.subscribe(() => this.close());

    // Show the sidenav on small devices when pressing the left actions
    this.shortcut.subscribe(ActionsLeft, () => {
      if (this.layout.gtmd) {
        return false;
      }
      this.toggle();
    });
  }

  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  get element(): HTMLElement {
    return this._element.nativeElement;
  }

  get rootContainer(): HTMLElement {
    return document.getElementsByClassName('root-container')[0] as HTMLElement;
  }

  open() {
    if (!this.opened) {
      // Sometimes the --window-width variable is not updated, and the close icon is not visible
      this.layout.updateWindowWidth();
      this.layout.setFocusTrap('sidenav-menu');
      const style = this.element.style;
      style.transform = 'translateX(0)';
      if (this.layout.gtxs) {
        this.rootContainer.style.transform = `translateX(${this.element.clientWidth}px)`;
      }
      const first = this.element.getElementsByClassName('menu-item')[0] as HTMLElement;
      if (first) {
        setTimeout(() => first.focus(), 1);
      }
      this.layout.showBackdrop(() => this.close());
      this.opened = true;
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (active) {
          active.blur();
        }
      }, 5);
      this.openSubs.push(
        this.shortcut.subscribe(ArrowsVertical, e => handleKeyboardFocus(this.layout, this.element, e))
      );
      this.openSubs.push(
        this.shortcut.subscribe(ActionsRight, () => {
          this.exit();
        })
      );
    }
  }

  close() {
    if (this.opened) {
      this.layout.setFocusTrap(null);
      const style = this.element.style;
      style.transform = '';
      this.rootContainer.style.transform = '';
      this.layout.hideBackdrop();
      this.opened = false;
      document.body.focus();
      this.openSubs.forEach(s => s.unsubscribe());
      this.openSubs = [];
    }
  }

  exit(event?: Event) {
    this.state.exit(event);
    this.close();
  }
}
