import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { LayoutService } from 'app/core/layout.service';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n } from 'app/i18n/i18n';
import { HeadingAction } from 'app/shared/action';
import { blank, truthyAttr } from 'app/shared/helper';
import { CardMode } from 'app/ui/content/card-mode';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { Subscription } from 'rxjs';

/**
 * Represents a box in the layout which contains an optional heading (title) and content.
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent implements OnInit, OnChanges {

  SvgIcon = SvgIcon;

  @Input() heading: string;
  @Input() mobileHeading: string;
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

  private _printContentOnly: boolean | string = false;
  @Input() get printContentOnly(): boolean | string {
    return this._printContentOnly;
  }
  set printContentOnly(printContentOnly: boolean | string) {
    this._printContentOnly = truthyAttr(printContentOnly);
  }

  constructor(
    public layoutService: LayoutService,
    public uiLayout: UiLayoutService,
    public breadcrumb: BreadcrumbService,
    public i18n: I18n,
    public element: ElementRef,
  ) { }

  get groupActions(): boolean {
    const singleAction = (this.headingActions || []).length === 1 ? this.headingActions[0] : null;
    return singleAction ? !singleAction.maybeRoot : true;
  }

  ngOnInit() {
    this.maybeUpdateTitle();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.heading || changes.mobileHeading) {
      this.maybeUpdateTitle();
    }
    if (changes.headingActions) {
      this.uiLayout.headingActions = (this.headingActions || []);
    }
  }

  private maybeUpdateTitle() {
    const page = this.uiLayout.currentPage;
    if (!page || page.updateTitleFrom() !== 'content') {
      return;
    }
    const heading = this.layoutService.gtxs ? this.heading : this.mobileHeading || this.heading;
    if (!blank(heading)) {
      this.uiLayout.title = heading;
    }
  }

}
