import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Currency, Image } from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Has some optional and predefined data: avatar, date and amount. Additional data comes from the tag content.
 */
@Component({
  selector: 'mobile-result',
  templateUrl: 'mobile-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileResultComponent implements OnInit {

  @Input() avatarImage: Image;
  @Input() avatarIcon: string;
  @Input() avatarRoundBorders: boolean;
  @Input() date: string;
  @Input() amount: string;
  @Input() amountColor = true;
  @Input() currency: Currency;
  @Input() title: string;

  _forceSign: boolean | string = false;
  @Input() get forceSign(): boolean | string {
    return this._forceSign;
  }
  set forceSign(force: boolean | string) {
    this._forceSign = truthyAttr(force);
  }

  hasAvatar: boolean;
  hasAmount: boolean;

  avatarClass: string;
  mainClass: string;
  amountClass: { [key: string]: boolean };

  constructor(
    private format: FormatService,
    public layout: LayoutService) {
  }

  ngOnInit() {
    this.hasAvatar = !!this.avatarImage || !!this.avatarIcon;
    this.hasAmount = !!this.amount;
    this.mainClass = this.hasAvatar ? 'col-9 col-xs-10' : 'col-12';
    if (this.hasAvatar) {
      this.avatarClass = 'col-3 col-xs-2 avatar';
    }
    if (this.hasAmount) {
      this.amountClass = {
        amount: true,
        'p-0': true,
        positive: this.amountColor && this.format.isPositive(this.amount),
        negative: this.amountColor && this.format.isNegative(this.amount),
      };
    }
  }
}
