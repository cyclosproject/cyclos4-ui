import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';

import { StoredFile } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { isEqual } from 'lodash-es';
import { BsModalRef } from 'ngx-bootstrap/modal';

export class ManageFilesResult {
  constructor(public order: string[], public removedFiles: string[]) {}
}

/**
 * Form used to reorder / remove files
 */
@Component({
  selector: 'manage-files',
  templateUrl: 'manage-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageFilesComponent extends BaseComponent implements OnInit {
  @Input() files: StoredFile[];
  @Output() result = new EventEmitter<ManageFilesResult>();

  removedIds: string[];
  originalOrder: string[];

  constructor(injector: Injector, public modalRef: BsModalRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.originalOrder = this.files.map(i => i.id);
  }

  remove(file: StoredFile) {
    this.removedIds = [file.id, ...(this.removedIds || [])];
    this.originalOrder = this.originalOrder.filter(i => i !== file.id);
    this.files = this.files.filter(f => f != file);
  }

  ok() {
    // Send the order if it has changed
    let order: string[] = null;
    const newOrder = this.files.map(i => i.id) as string[];
    if (!isEqual(newOrder, this.originalOrder)) {
      order = newOrder;
    }
    this.result.emit(new ManageFilesResult(order, this.removedIds));
  }

  drop(event: CdkDragDrop<StoredFile[]>) {
    this.files = [...this.files];
    moveItemInArray(this.files, event.previousIndex, event.currentIndex);
  }
}
