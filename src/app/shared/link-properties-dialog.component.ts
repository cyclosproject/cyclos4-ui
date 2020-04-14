import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { LinkProperties } from 'app/shared/link-properties';
import { BsModalRef } from 'ngx-bootstrap';

/**
 * A dialog used by `html-field` to edit an hyperlink properties
 */
@Component({
  selector: 'link-properties-dialog',
  templateUrl: 'link-properties-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkPropertiesDialogComponent
  extends BaseComponent implements OnInit {

  form: FormGroup;
  @Input() link: HTMLAnchorElement;
  @Output() select = new EventEmitter<LinkProperties>();

  constructor(
    injector: Injector,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      text: [this.link ? this.link.innerText : null, this.link ? Validators.required : null],
      href: [this.link ? this.link.href : null, Validators.required]
    });
  }

  save() {
    this.select.emit(this.form.value);
    this.modalRef.hide();
  }
}
