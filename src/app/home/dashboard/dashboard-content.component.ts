import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Content } from 'app/content/content';
import { ContentService } from 'app/core/content.service';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays a content in the dashboard
 */
@Component({
  selector: 'dashboard-content',
  templateUrl: 'dashboard-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardContentComponent extends BaseDashboardComponent implements OnInit {

  @Input() content: Content;
  @Input() title: string;
  @Input() mobileTitle: string;
  @Input() tight: boolean;

  content$ = new BehaviorSubject<string>(null);

  constructor(injector: Injector,
    public contentService: ContentService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.contentService.get(this.content).subscribe(html => {
      this.content$.next(html || '');
    }));
  }
}
