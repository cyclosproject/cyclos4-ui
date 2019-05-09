import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardItemType } from 'app/content/dashbord-item-type';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';
import { blank } from 'app/shared/helper';

/**
 * An item in the dashboard
 */
@Component({
  selector: 'dashboard-item',
  templateUrl: 'dashboard-item.component.html',
  styleUrls: ['dashboard-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardItemComponent extends BaseComponent implements OnInit {
  DashboardItemType = DashboardItemType;

  @Input() last: boolean;
  @Input() config: DashboardItemConfig;
  @Output() ready = new EventEmitter<boolean>(true);

  data: any;
  ready$ = new BehaviorSubject(false);
  minHeight$ = new BehaviorSubject<string>(null);

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.data = this.config.data || {};
    const breakpoints = [];
    this.layout.activeBreakpoints.forEach(b => {
      breakpoints.push(b);
    });

    const minHeight = this.config.minHeight || '';
    if (!blank(minHeight)) {
      this.addSub(this.layout.gtmd$.subscribe(gtmd => {
        this.minHeight$.next(gtmd ? minHeight : null);
      }));
      if (this.layout.gtmd) {
        this.minHeight$.next(minHeight);
      }
    }

  }

  notifyReady(event: boolean) {
    if (event !== false) {
      this.ready$.next(true);
      this.ready.emit(true);
    }
  }

}
