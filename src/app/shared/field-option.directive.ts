import { Directive, OnDestroy, OnInit, Inject, Input } from '@angular/core';
import { BaseFormFieldWithOptionsComponent, FORM_FIELD_WITH_OPTIONS } from 'app/shared/base-form-field-with-options.component';
import { FieldOption } from 'app/shared/field-option';

/**
 * Represents an option in a component that allows choosing among multiple options, such as
 * single / multi selections, radio groups and checkbox groups.
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'field-option'
})
export class FieldOptionDirective implements OnInit, OnDestroy, FieldOption {

  @Input() id: string;
  @Input() internalName: string;
  @Input() value: string;
  @Input() text: string;
  @Input() category: string;
  @Input() parent: string;

  constructor(
    @Inject(FORM_FIELD_WITH_OPTIONS) private component: BaseFormFieldWithOptionsComponent<any>
  ) { }

  ngOnInit(): void {
    this.component.addOption(this);
  }

  ngOnDestroy(): void {
    this.component.removeOption(this);
  }

  get level(): number {
    return this.parent ? 1 : 0;
  }

}
