import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { HeadingAction } from 'app/shared/action';
import { LayoutService } from 'app/shared/layout.service';
import { truthyAttr } from 'app/shared/helper';

/**
 * Represents a box in the layout which contains an optional heading (title) and content.
 */
@Component({
  selector: 'page-content',
  templateUrl: 'page-content.component.html',
  styleUrls: ['page-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageContentComponent implements OnInit {

  @HostBinding('style.flex-grow') flexGrow: string;

  @Input() heading: string;
  @Input() headingActions: HeadingAction[];
  @Input() layout: 'normal' | 'centered' = 'normal';
  @Input() mode: 'normal' | 'viewForm' | 'filters' | 'table' | 'tight' | 'transparent' | 'fullHeight' | 'fullHeightTight' = 'normal';

  private _last: boolean | string = false;
  @Input() get last(): boolean | string {
    return this._last;
  }
  set last(last: boolean | string) {
    this._last = truthyAttr(last);
  }

  constructor(
    public layoutService: LayoutService,
    public breadcrumb: BreadcrumbService
  ) { }

  get groupActions(): boolean {
    const singleAction = (this.headingActions || []).length === 1 ? this.headingActions[0] : null;
    return singleAction ? !singleAction.maybeRoot : true;
  }

  ngOnInit(): void {
    this.flexGrow = ['fullHeight', 'fullHeightTight'].includes(this.mode) ? '1' : '0';
  }
}
