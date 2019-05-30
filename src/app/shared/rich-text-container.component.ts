import { ChangeDetectionStrategy, Component, Input, HostBinding } from '@angular/core';
import { truthyAttr } from 'app/shared/helper';

/**
 * Component used to display arbitrary HTML content in a safe way
 */
@Component({
  selector: 'rich-text-container',
  templateUrl: 'rich-text-container.component.html',
  styleUrls: ['rich-text-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichTextContainerComponent {

  /**
   * Either this has to be specified or the other 3: fields + fieldName + object
   */
  @Input() value: string;

  private _autoHeight: boolean | string = false;
  @HostBinding('class.autoheight') @Input() get autoHeight(): boolean | string {
    return this._autoHeight;
  }
  set autoHeight(a: boolean | string) {
    this._autoHeight = truthyAttr(a);
  }

}
