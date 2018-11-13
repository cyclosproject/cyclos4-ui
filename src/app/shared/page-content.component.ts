import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, Optional } from '@angular/core';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { HeadingAction } from 'app/shared/action';
import { LayoutService } from 'app/shared/layout.service';
import { BehaviorSubject } from 'rxjs';
import { PageLayoutComponent } from 'app/shared/page-layout.component';

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

  first$ = new BehaviorSubject(false);
  set first(first: boolean) {
    this.first$.next(first);
  }
  get first(): boolean {
    return this.first$.value;
  }

  last$ = new BehaviorSubject(false);
  set last(last: boolean) {
    this.last$.next(last);
  }
  get last(): boolean {
    return this.last$.value;
  }

  @Input() heading: string;
  @Input() headingActions: HeadingAction[];
  @Input() layout: 'normal' | 'centered' = 'normal';
  @Input() mode: 'normal' | 'viewForm' | 'filters' | 'table' | 'tight' | 'transparent' | 'fullHeight' | 'fullHeightTight' = 'normal';

  constructor(
    public layoutService: LayoutService,
    public breadcrumb: BreadcrumbService,
    @Optional() private pageLayout: PageLayoutComponent
  ) { }

  get groupActions(): boolean {
    const singleAction = (this.headingActions || []).length === 1 ? this.headingActions[0] : null;
    return singleAction ? !singleAction.maybeRoot : true;
  }

  ngOnInit(): void {
    this.flexGrow = ['fullHeight', 'fullHeightTight'].includes(this.mode) ? '1' : '0';
    if (this.pageLayout) {
      this.pageLayout.addContent(this);
    }
  }
}
