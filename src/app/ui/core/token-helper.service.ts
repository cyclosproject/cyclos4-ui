import { Injectable } from '@angular/core';
import { PhysicalTokenTypeEnum } from 'app/api/models';
import { TokenType } from 'app/api/models/token-type';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Helper for tokens
 */
@Injectable({
  providedIn: 'root'
})
export class TokenHelperService {
  /**
   * Returns the icon name that should be used for the given operation
   */
  icon(type: TokenType): SvgIcon {
    const phys = type?.physicalType || PhysicalTokenTypeEnum.OTHER;
    switch (phys) {
      case PhysicalTokenTypeEnum.QR_CODE:
        return SvgIcon.QrCodeScan;
      case PhysicalTokenTypeEnum.BARCODE:
        return SvgIcon.UpcScan;
      case PhysicalTokenTypeEnum.NFC_TAG:
        return SvgIcon.Broadcast;
      default:
        return SvgIcon.CreditCard;
    }
  }
}
