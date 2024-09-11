import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { AdCategoryWithChildren } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A component to be shown a category and its descendants
 */
@Component({
  selector: 'category-hierarchy',
  templateUrl: 'category-hierarchy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryHierarchyComponent extends BaseComponent implements OnInit {
  @Input() category: AdCategoryWithChildren;
  @Input() level = 0;
  @Output() select = new EventEmitter<AdCategoryWithChildren>();

  constructor(injector: Injector, public modalRef: BsModalRef) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.element.classList.add('level-' + this.level);
  }

  emit(cat: AdCategoryWithChildren, event?: MouseEvent) {
    this.select.emit(cat);
    event?.preventDefault();
    this.modalRef.hide();
  }
}
