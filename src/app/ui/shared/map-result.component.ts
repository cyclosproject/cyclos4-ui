import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { Address, Image } from 'app/api/models';

/**
 * A result when result type is map.
 */
@Component({
  selector: 'map-result',
  templateUrl: 'map-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapResultComponent implements AfterViewInit, AfterViewChecked {
  @Input() image: Image;
  @Input() address: Address;
  classAdded = false;

  constructor(private element: ElementRef) {}

  ngAfterViewInit() {
    this.maybeAssignParentClass();
  }

  ngAfterViewChecked() {
    this.maybeAssignParentClass();
  }

  private maybeAssignParentClass() {
    if (this.classAdded) {
      return;
    }
    const element = this.element.nativeElement as HTMLElement;
    if (element.parentElement) {
      element.parentElement.classList.add('map-info-window');
    }
    this.classAdded = true;
  }
}
