import {
  Component, ChangeDetectionStrategy, Injector, Input, Output, EventEmitter, OnInit
} from '@angular/core';

import { BaseComponent } from 'app/shared/base.component';
import { StoredFile } from 'app/api/models';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormControl } from '@angular/forms';
import { isEqual } from 'lodash';

export class ManageFilesResult {
  constructor(
    public order: string[],
    public removedFiles: string[]
  ) { }
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
  order: FormControl;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.order = this.formBuilder.control(this.files);
    this.originalOrder = this.files.map(i => i.id);
  }

  remove(file: StoredFile) {
    this.removedIds = [file.id, ...this.removedIds];
    this.originalOrder = this.originalOrder.filter(i => i !== file.id);
    this.order.setValue((this.order.value || []).filter(i => i.id !== file.id));
  }

  ok() {
    // Send the order if it has changed
    let order: string[] = null;
    const newOrder = this.order.value.map(i => i.id) as string[];
    if (!isEqual(newOrder, this.originalOrder)) {
      order = newOrder;
    }
    this.result.emit(new ManageFilesResult(order, this.removedIds));
  }

}
