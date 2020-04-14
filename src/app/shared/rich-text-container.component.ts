import { ChangeDetectionStrategy, Component, Input, HostBinding, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { truthyAttr, htmlCollectionToArray, blurIfClick } from 'app/shared/helper';

/**
 * Component used to display arbitrary HTML content in a safe way
 */
@Component({
  selector: 'rich-text-container',
  templateUrl: 'rich-text-container.component.html',
  styleUrls: ['rich-text-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichTextContainerComponent implements AfterViewInit {

  /**
   * Either this has to be specified or the other 3: fields + fieldName + object
   */
  @Input() value: string;

  @ViewChild('content', { static: true }) content: ElementRef<HTMLElement>;

  private _autoHeight: boolean | string = false;
  @HostBinding('class.autoheight') @Input() get autoHeight(): boolean | string {
    return this._autoHeight;
  }
  set autoHeight(a: boolean | string) {
    this._autoHeight = truthyAttr(a);
  }

  ngAfterViewInit() {
    // Set all anchors to open in a new browser window / tab
    htmlCollectionToArray(this.content.nativeElement.getElementsByTagName('a')).forEach((a: HTMLAnchorElement) => {
      if (a.href) {
        a.target = '_blank';
      }
      a.addEventListener('click', e => {
        blurIfClick(a, e);
      }, false);
    });
  }

}
