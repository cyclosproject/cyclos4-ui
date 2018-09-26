import { Component, ChangeDetectionStrategy, Input, ElementRef, OnInit, HostBinding } from '@angular/core';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';
import { empty } from 'app/shared/helper';

// Use the require method provided by webpack
declare const require;

/**
 * Shows a material icon.
 * Also supports svg icons.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'icon',
  templateUrl: 'icon.component.html',
  styleUrls: ['icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  @HostBinding('class.material-icons') regularIcon: string;

  @Input() set icon(icon: string) {
    if (this.svgIconRegistry.isSvgIcon(icon)) {
      this.svgIconRegistry.svg(icon).subscribe(svg => this.setSvgElement(svg));
    } else {
      this.regularIcon = icon;
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
    if (this.element.nativeElement) {
      const style = (<HTMLElement>this.element.nativeElement).style;
      style.fontSize = this._size;
      style.height = this._size;
      style.width = this._size;
      style.lineHeight = this._size;
    }
  }

  constructor(
    private element: ElementRef,
    private svgIconRegistry: SvgIconRegistry
  ) {
    this.size = null;
  }

  private setSvgElement(svg: SVGElement) {
    this.clearSvgElement();

    // Workaround for IE11 and Edge ignoring `style` tags inside dynamically-created SVGs.
    // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10898469/
    // Do this before inserting the element into the DOM, in order to avoid a style recalculation.
    const styleTags = svg.querySelectorAll('style') as NodeListOf<HTMLStyleElement>;

    for (let i = 0; i < styleTags.length; i++) {
      styleTags[i].textContent += ' ';
    }
    this.element.nativeElement.appendChild(svg);
  }

  private clearSvgElement() {
    const layoutElement: HTMLElement = this.element.nativeElement;
    let childCount = layoutElement.childNodes.length;

    // Remove existing non-element child nodes and SVGs, and add the new SVG element. Note that
    // we can't use innerHTML, because IE will throw if the element has a data binding.
    while (childCount--) {
      const child = layoutElement.childNodes[childCount];

      // 1 corresponds to Node.ELEMENT_NODE. We remove all non-element nodes in order to get rid
      // of any loose text nodes, as well as any SVG elements in order to remove any old icons.
      if (child.nodeType !== 1 || child.nodeName.toLowerCase() === 'svg') {
        layoutElement.removeChild(child);
      }
    }
  }
}
