import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Image } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { isEqual } from 'lodash';
import { BsModalRef } from 'ngx-bootstrap/modal';

export class ManageImagesResult {
  constructor(
    public order: string[],
    public removedImages: string[],
  ) { }
}

/**
 * Form used to reorder / remove images
 */
@Component({
  selector: 'manage-images',
  templateUrl: 'manage-images.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageImagesComponent extends BaseComponent implements OnInit {

  @Input() images: Image[] = [];
  @Input() manageAfterConfirm = true;
  @Output() result = new EventEmitter<ManageImagesResult>();

  removedIds: string[];
  originalOrder: string[];
  order: FormControl;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.order = this.formBuilder.control(this.images);
    this.originalOrder = this.images.map(i => i.id);
  }

  remove(image: Image) {
    this.removedIds = [image.id, ...(this.removedIds || [])];
    this.originalOrder = this.originalOrder.filter(i => i !== image.id);
    this.order.setValue((this.order.value || []).filter(i => i.id !== image.id));
  }

  ok() {
    // Send the order if it has changed
    let order: string[] = null;
    const newOrder = this.order.value.map(i => i.id) as string[];
    if (!isEqual(newOrder, this.originalOrder)) {
      order = newOrder;
    }
    this.result.emit(new ManageImagesResult(order, this.removedIds));
  }

}
