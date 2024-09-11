import { Directive } from '@angular/core';

/**
 * Renders an additional cell in a `label-value`.
 * Currently a single `extraCell` is supported by `label-value`.
 */
@Directive({
  selector: '[extraCell]'
})
export class ExtraCellDirective {}
