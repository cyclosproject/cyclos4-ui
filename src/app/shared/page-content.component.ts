import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { HeadingAction } from 'app/shared/action';
import { truthyAttr, blank } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';

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
  @HostBinding('attr.mode') @Input()
  mode: 'normal' | 'viewForm' | 'filters' | 'table' | 'tight' | 'transparent' | 'fullHeight' | 'fullHeightTight' = 'normal';

  private _last: boolean | string = false;
  @Input() get last(): boolean | string {
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
    public breadcrumb: BreadcrumbService
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

  private maybeUpdateTitle() {
    const page = this.layoutService.currentPage;
    if (!blank(this.heading) && page && page.updateTitleFrom() === 'content') {
      this.layoutService.setTitle(this.heading);
    }
  }

}
