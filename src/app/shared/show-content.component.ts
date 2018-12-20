import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, Input } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { ContentWithLayout } from 'app/content/content-with-layout';
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

  @Input() content: ContentWithLayout;

  content$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    public contentService: ContentService,
    private element: ElementRef) {
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
        const element: HTMLElement = this.element.nativeElement;
        element.innerHTML = content;
      }
    }));
  }
}
