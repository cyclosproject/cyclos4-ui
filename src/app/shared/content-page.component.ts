import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, Input } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { ContentPage } from 'app/content/content-page';
import { BehaviorSubject } from 'rxjs';

/**
 * Shows a content page
 */
@Component({
  selector: 'content-page',
  templateUrl: 'content-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentPageComponent extends BaseComponent implements OnInit {

  @Input() contentPage: ContentPage;

  content$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    public contentService: ContentService,
    private element: ElementRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const layout = this.contentPage.layout || 'full';

    this.addSub(this.contentService.get(this.contentPage).subscribe(content => {
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
