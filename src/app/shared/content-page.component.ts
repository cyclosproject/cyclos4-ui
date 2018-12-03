import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, Input } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { ContentPage } from 'app/content/content-page';

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

  constructor(
    injector: Injector,
    public contentService: ContentService,
    private element: ElementRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const layout = this.contentPage.layout || 'full';

    if (layout !== 'card') {
      // When the content is not card, fetch the content and update the innerHTML directly
      // When is card, will be handled in the template
      this.addSub(this.contentService.get(this.contentPage).subscribe(content => {
        const element: HTMLElement = this.element.nativeElement;
        element.innerHTML = content;
      }));
    }
  }
}
