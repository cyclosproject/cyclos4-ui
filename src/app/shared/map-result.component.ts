import { ChangeDetectionStrategy, Component, Input, ElementRef, AfterViewInit } from '@angular/core';
import { Image, Address } from 'app/api/models';

/**
 * A result when result type is map.
 */
@Component({
  selector: 'map-result',
  templateUrl: 'map-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapResultComponent implements AfterViewInit {

  @Input() image: Image;
  @Input() address: Address;

  constructor(private element: ElementRef) {
  }

  ngAfterViewInit() {
    const element = this.element.nativeElement as HTMLElement;
    element.parentElement.classList.add('map-info-window');
  }
}
