import { Component, ChangeDetectionStrategy, Injector, Input, Output, EventEmitter } from '@angular/core';

import { AdCategoryWithChildren, Image } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A component to be shown in a dialog, displaying all sub-categories of a category
 */
@Component({
  selector: 'show-sub-categories',
  templateUrl: 'show-sub-categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowSubCategoriesComponent extends BaseComponent {

  @Input() category: AdCategoryWithChildren;
  @Input() image: Image;
  @Input() icon: string;
  @Input() color: string;
  @Output() select = new EventEmitter<AdCategoryWithChildren>();

  constructor(
    injector: Injector,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  emit(cat: AdCategoryWithChildren, event: MouseEvent) {
    this.select.emit(cat);
    event.preventDefault();
    this.modalRef.hide();
  }

}
