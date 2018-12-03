import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit } from '@angular/core';
import { ContentService } from 'app/core/content.service';
import { BaseComponent } from 'app/shared/base.component';
import { environment } from 'environments/environment';

/**
 * The content of the home page, shown for guests on large screens
 */
@Component({
  selector: 'home-content',
  templateUrl: 'home-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeContentComponent extends BaseComponent implements OnInit {

  home = environment.homeContent;

  constructor(
    injector: Injector,
    public contentService: ContentService,
    private element: ElementRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const layout = this.home.layout || 'full';

    if (layout !== 'card') {
      // When the content is not card, fetch the content and update the innerHTML directly
      // When is card, will be handled in the template
      this.addSub(this.contentService.get(this.home).subscribe(content => {
        const element: HTMLElement = this.element.nativeElement;
        element.innerHTML = content;
      }));
    }
  }
}
