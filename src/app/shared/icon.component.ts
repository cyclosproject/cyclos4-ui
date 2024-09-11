import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { SvgIcon } from 'app/core/svg-icon';
import { empty } from 'app/shared/helper';

/**
 * Shows an SVG icon
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'icon',
  templateUrl: 'icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  @Input() set icon(icon: SvgIcon | string) {
    this.element.innerHTML = this.iconLoader.svg(icon);
  }

  private _size: string;
  @Input() get size(): string {
    return this._size;
  }
  set size(size: string) {
    if (empty(size)) {
      this._size = '1.2rem';
    } else if (typeof size === 'number' || /^\d+$/.test(size)) {
      this._size = `${size}px`;
    } else {
      this._size = size;
    }
    const style = this.element.style;
    style.height = this._size;
    style.width = this._size;
  }

  public get element(): HTMLElement {
    return this.elementRef.nativeElement as HTMLElement;
  }

  constructor(private elementRef: ElementRef, private iconLoader: IconLoadingService) {}
}
