import { Component, InjectionToken } from '@angular/core';

export const FLOAT_LABELS = new InjectionToken<FloatLabelsComponent>('floatLabels');

@Component({
  selector: 'float-labels',
  template: '<ng-content></ng-content>',
  providers: [
    { provide: FLOAT_LABELS, useExisting: FloatLabelsComponent, multi: true },
  ],
})
export class FloatLabelsComponent {

}