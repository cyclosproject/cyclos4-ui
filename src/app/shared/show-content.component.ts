import { ChangeDetectionStrategy, Component, HostBinding, Injector, Input, OnInit } from '@angular/core';
import { ContentWithLayout } from 'app/content/content-with-layout';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Shows a content with layout
 */
@Component({
  selector: 'show-content',
  templateUrl: 'show-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowContentComponent extends BaseComponent implements OnInit {

  @HostBinding('class.d-flex') classFlex = true;
  @HostBinding('class.flex-column') classFlexColumn = true;
  @HostBinding('class.flex-grow-1') classFlexGrow = true;

  @Input() content: ContentWithLayout;

  content$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    public contentService: ContentService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const layout = this.content.layout || 'full';

    this.addSub(this.contentService.get(this.content).subscribe(content => {
      if (layout === 'card') {
        // When card the template will render the content
        this.content$.next(content);
      } else {
        // When not card, replace this element's inner HTML
        this.element.innerHTML = content;
      }
    }));
  }
}
