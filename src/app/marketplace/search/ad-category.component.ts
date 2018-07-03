import { Component, ChangeDetectionStrategy, Injector, Input, EventEmitter, Output } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { AdCategoryWithChildren, Image } from 'app/api/models';
import { environment } from 'environments/environment';

/**
 * Displays an advertisement category with it's sub-categories
 */
@Component({
  selector: 'ad-category',
  templateUrl: 'ad-category.component.html',
  styleUrls: ['ad-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdCategoryComponent extends BaseComponent {

  constructor(injector: Injector) {
    super(injector);
  }

  @Input() category: AdCategoryWithChildren;

  @Input() tileWidth: number;

  get icon(): string {
    const icons = environment.adCategoryIcons || {};
    return icons[this.category.internalName];
  }

  get image(): Image {
    return this.icon ? null : this.category.image;
  }
}
