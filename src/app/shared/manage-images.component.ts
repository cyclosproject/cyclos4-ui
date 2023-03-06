import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Image } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { isEqual } from 'lodash-es';
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
  @Input() manageAfterConfirm = false;
  @Input() requireAtLeastOne = false;
  @Output() result = new EventEmitter<ManageImagesResult>();

  removedIds: string[];
  originalOrder: string[];

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private changeDetector: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.originalOrder = this.images.map(i => i.id);
  }

  remove(image: Image) {
    this.images = this.images.filter(i => i != image);
    this.removedIds = [image.id, ...(this.removedIds || [])];
    this.changeDetector.detectChanges();
  }

  ok() {
    // Send the order if it has changed
    let order: string[] = null;
    const newOrder = this.images.map(i => i.id) as string[];
    if (!isEqual(newOrder, this.originalOrder)) {
      order = newOrder;
    }
    this.result.emit(new ManageImagesResult(order, this.removedIds));
  }

  drop(event: CdkDragDrop<Image[]>) {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
  }
}
