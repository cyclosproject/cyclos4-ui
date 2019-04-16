import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { HeadingAction } from 'app/shared/action';
import { truthyAttr, blank } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { CardMode } from 'app/content/card-mode';
import { I18n } from 'app/i18n/i18n';
import { Subscription } from 'rxjs';
import { ShortcutService } from 'app/shared/shortcut.service';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown/public_api';

/**
 * Represents a box in the layout which contains an optional heading (title) and content.
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  styleUrls: ['page-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContentComponent implements OnInit, OnChanges {

  @Input() heading: string;
  @Input() headingActions: HeadingAction[];
  @Input() layout: 'normal' | 'centered' = 'normal';
  @HostBinding('attr.mode') @Input() mode: CardMode = 'normal';

  shortcutsSub: Subscription;

  private _last: boolean | string = false;
  @HostBinding('attr.last') @Input() get last(): boolean | string {
    return this._last;
  }
  set last(last: boolean | string) {
    this._last = truthyAttr(last);
  }

  private _hideBack: boolean | string = false;
  @Input() get hideBack(): boolean | string {
    return this._hideBack;
  }
  set hideBack(hideBack: boolean | string) {
    this._hideBack = truthyAttr(hideBack);
  }

  constructor(
    public layoutService: LayoutService,
    public breadcrumb: BreadcrumbService,
    public i18n: I18n,
    private shortcut: ShortcutService,
    private element: ElementRef
  ) { }

  get groupActions(): boolean {
    const singleAction = (this.headingActions || []).length === 1 ? this.headingActions[0] : null;
    return singleAction ? !singleAction.maybeRoot : true;
  }

  ngOnInit() {
    this.maybeUpdateTitle();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['heading']) {
      this.maybeUpdateTitle();
    }
  }

  addActionsShortcuts(dropdown: BsDropdownDirective) {
    const keys = ['ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape'];
    const element = this.element.nativeElement as HTMLElement;
    this.shortcutsSub = this.shortcut.subscribe(keys, event => {
      const active = document.activeElement as HTMLElement;
      let index = -1;
      let alsoClick = false;
      active.classList.forEach(c => {
        const match = c.match(/heading\-action\-(\d+)/);
        if (match) {
          index = Number.parseInt(match[1], 10);
        }
      });
      switch (event.key) {
        case 'Escape':
          dropdown.hide();
          return;
        case 'ArrowUp':
          index--;
          break;
        case 'ArrowDown':
          index++;
          break;
        case ' ':
        case 'Enter':
          if (index < 0) {
            dropdown.toggle();
            return;
          }
          alsoClick = true;
          break;
      }
      index = Math.min(Math.max(0, index), this.headingActions.length - 1);
      const toFocus = element.getElementsByClassName(`heading-action-${index}`);
      if (toFocus.length > 0) {
        const focusEl = toFocus.item(0) as HTMLElement;
        focusEl.focus();
        if (alsoClick) {
          focusEl.click();
        }
      }
    });
  }

  removeActionsShortcuts() {
    if (this.shortcutsSub) {
      this.shortcutsSub.unsubscribe();
      this.shortcutsSub = null;
    }
  }

  private maybeUpdateTitle() {
    const page = this.layoutService.currentPage;
    if (!blank(this.heading) && page && page.updateTitleFrom() === 'content') {
      this.layoutService.setTitle(this.heading);
    }
  }

}
