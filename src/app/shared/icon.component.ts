import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { empty } from 'app/shared/helper';
import { ICON_CONTENTS, ICON_NAMES } from 'app/shared/icon';

/**
 * Shows either an SVG icon or a glyph from the material icon font
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'icon',
  templateUrl: 'icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  @Input() set icon(icon: string) {
    const element = this.element;
    if (ICON_NAMES.includes(icon)) {
      // An SVG icon
      element.classList.remove('material-icons');
      this.element.innerHTML = ICON_CONTENTS[icon];
    } else {
      // A font icon
      element.classList.add('material-icons');
      this.element.innerHTML = icon;
    }
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
    style.fontSize = this._size;
    style.height = this._size;
    style.width = this._size;
    style.lineHeight = this._size;
  }

  private get element(): HTMLElement {
    return this.elementRef.nativeElement as HTMLElement;
  }

  constructor(private elementRef: ElementRef) {
    this.size = null;
  }
}
