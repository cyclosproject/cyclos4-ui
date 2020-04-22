import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A component to be shown in a dialog, allowing to enter a comment inside a textarea
 */
@Component({
  selector: 'text-dialog',
  templateUrl: 'text-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDialogComponent extends BaseComponent {

  @Input() title: string;
  @Output() done = new EventEmitter<string>();

  control = new FormControl(null, Validators.required);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  submit() {
    this.done.emit(this.control.value);
    this.modalRef.hide();
  }

}
