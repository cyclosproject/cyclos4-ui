import { Inject, Injectable } from '@angular/core';
import { QuickAccess, QuickAccessTypeEnum, RecordLayoutEnum, User } from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { RecordHelperService } from 'app/ui/core/records-helper.service';
import { TokenHelperService } from 'app/ui/core/token-helper.service';
import { WizardHelperService } from 'app/ui/core/wizard-helper.service';

export interface IconAndLabel {
  icon: string;
  label: string;
}

/**
 * Helper for handling quick access items
 */
@Injectable({
  providedIn: 'root',
})
export class QuickAccessHelperService {

  constructor(
    private dataForFrontendHolder: DataForFrontendHolder,
    private operationHelper: OperationHelperService,
    private wizardHelper: WizardHelperService,
    private recordHelper: RecordHelperService,
    private tokenHelper: TokenHelperService,
    @Inject(I18nInjectionToken) private i18n: I18n
  ) {
  }

  /**
   * Returns the icon to be used in the given quick access
   */
  iconAndLabel(quickAccess: QuickAccess, user?: User): IconAndLabel {
    if (!user) {
      user = this.dataForFrontendHolder.user;
    }
    if (!user) {
      return null;
    }
    var isSelf = user.id === this.dataForFrontendHolder.user?.id;
    var permissions = isSelf ? this.dataForFrontendHolder.auth?.permissions : {};
    switch (quickAccess.type) {
      case QuickAccessTypeEnum.ACCOUNT:
        return { icon: SvgIcon.Wallet2, label: this.i18n.dashboard.action.accounts };
      case QuickAccessTypeEnum.TRANSFERS_OVERVIEW:
        return { icon: SvgIcon.Wallet2ArrowLeftRight, label: this.i18n.dashboard.action.transfersOverview };
      case QuickAccessTypeEnum.BALANCES_OVERVIEW:
        return { icon: SvgIcon.Wallet2Person, label: this.i18n.dashboard.action.balancesOverview };
      case QuickAccessTypeEnum.PAY_USER:
        return { icon: SvgIcon.Wallet2ArrowRight, label: this.i18n.dashboard.action.payUser };
      case QuickAccessTypeEnum.PAY_SYSTEM:
        return { icon: SvgIcon.Wallet2ArrowRight, label: this.i18n.dashboard.action.paySystem };
      case QuickAccessTypeEnum.PAY_SELF:
        return { icon: SvgIcon.Wallet2ArrowLeftRight, label: this.i18n.dashboard.action.paySelf };
      case QuickAccessTypeEnum.POS:
        return { icon: SvgIcon.CreditCard, label: this.i18n.dashboard.action.pos };
      case QuickAccessTypeEnum.RECEIVE_QR_PAYMENT:
        return { icon: SvgIcon.QrCodeScan, label: this.i18n.dashboard.action.receiveQrPayment };
      case QuickAccessTypeEnum.SCHEDULED_PAYMENTS:
        return { icon: SvgIcon.CalendarEvent, label: this.i18n.dashboard.action.scheduledPayments };
      case QuickAccessTypeEnum.REQUEST_PAYMENT_FROM_USER:
        return { icon: SvgIcon.Wallet2ArrowLeft, label: this.i18n.dashboard.action.sendPaymentRequestToUser };
      case QuickAccessTypeEnum.REQUEST_PAYMENT_FROM_SYSTEM:
        return { icon: SvgIcon.Wallet2ArrowLeft, label: this.i18n.dashboard.action.sendPaymentRequestToSystem };
      case QuickAccessTypeEnum.PAYMENT_REQUESTS:
        return { icon: SvgIcon.Wallet2ArrowLeft, label: this.i18n.dashboard.action.paymentRequests };
      case QuickAccessTypeEnum.PAY_EXTERNAL_USER:
        return { icon: SvgIcon.Wallet2ArrowUpRight, label: this.i18n.dashboard.action.payExternalUser };
      case QuickAccessTypeEnum.EXTERNAL_PAYMENTS:
        return { icon: SvgIcon.Wallet2ArrowUpRight, label: this.i18n.dashboard.action.externalPayments };
      case QuickAccessTypeEnum.VOUCHERS:
        return { icon: SvgIcon.Ticket, label: this.i18n.dashboard.action.vouchers };
      case QuickAccessTypeEnum.BUY_VOUCHER:
        return { icon: SvgIcon.TicketArrowLeft, label: this.i18n.dashboard.action.buy };
      case QuickAccessTypeEnum.SEND_VOUCHER:
        return { icon: SvgIcon.TicketArrowRight, label: this.i18n.dashboard.action.send };
      case QuickAccessTypeEnum.VOUCHER_TRANSACTIONS:
        const voucherTransactionsLabel = isSelf && this.dataForFrontendHolder.dataForFrontend.topUpEnabled ?
          this.i18n.dashboard.action.voucherTransactions : this.i18n.dashboard.action.voucherTransactionsRedeems;
        return { icon: SvgIcon.TicketDetailed, label: voucherTransactionsLabel };
      case QuickAccessTypeEnum.REDEEM_VOUCHER:
        return { icon: SvgIcon.TicketArrowDown, label: this.i18n.dashboard.action.redeem };
      case QuickAccessTypeEnum.TOP_UP_VOUCHER:
        return { icon: SvgIcon.TicketArrowUp, label: this.i18n.dashboard.action.topUp };
      case QuickAccessTypeEnum.CONTACTS:
        return { icon: SvgIcon.Book, label: this.i18n.dashboard.action.contacts };
      case QuickAccessTypeEnum.SEARCH_USERS:
        return { icon: SvgIcon.People, label: this.i18n.dashboard.action.directory };
      case QuickAccessTypeEnum.PENDING_USERS:
        return { icon: SvgIcon.PersonCheck, label: this.i18n.dashboard.action.pendingUsers };
      case QuickAccessTypeEnum.BROKERED_USERS:
        return { icon: SvgIcon.PersonSquareOutline, label: this.i18n.dashboard.action.brokeredUsers };
      case QuickAccessTypeEnum.REGISTER_USER:
        return { icon: SvgIcon.PersonPlus, label: this.i18n.dashboard.action.registerUser };
      case QuickAccessTypeEnum.INVITE_USER:
        return { icon: SvgIcon.EnvelopeOpen, label: this.i18n.dashboard.action.inviteUser };
      case QuickAccessTypeEnum.SEARCH_ADS:
        return { icon: SvgIcon.Basket, label: this.i18n.dashboard.action.advertisements };
      case QuickAccessTypeEnum.AD_INTERESTS:
        return { icon: SvgIcon.Basket, label: this.i18n.dashboard.action.adInterests };
      case QuickAccessTypeEnum.PURCHASES:
        return { icon: SvgIcon.Cart3, label: this.i18n.dashboard.action.purchases };
      case QuickAccessTypeEnum.MY_ADS:
        return { icon: SvgIcon.Basket, label: this.i18n.dashboard.action.myAds };
      case QuickAccessTypeEnum.CREATE_AD:
        return { icon: SvgIcon.Basket, label: this.i18n.dashboard.action.createAd };
      case QuickAccessTypeEnum.MY_WEBSHOP:
        return { icon: SvgIcon.Basket, label: this.i18n.dashboard.action.myWebshop };
      case QuickAccessTypeEnum.CREATE_WEBSHOP_AD:
        return { icon: SvgIcon.Basket, label: this.i18n.dashboard.action.createWebshopAd };
      case QuickAccessTypeEnum.SALES:
        return { icon: SvgIcon.Receipt, label: this.i18n.dashboard.action.sales };
      case QuickAccessTypeEnum.EDIT_PROFILE:
        return { icon: SvgIcon.Person, label: this.i18n.dashboard.action.editProfile };
      case QuickAccessTypeEnum.PASSWORDS:
        const passwordsLabel = isSelf && permissions.passwords.passwords.length === 1 ?
          this.i18n.dashboard.action.password :
          this.i18n.dashboard.action.passwords;
        return { icon: SvgIcon.Key, label: passwordsLabel };
      case QuickAccessTypeEnum.DOCUMENTS:
        return { icon: SvgIcon.FileEarmarkText, label: this.i18n.dashboard.action.documents };
      case QuickAccessTypeEnum.MESSAGES:
        return { icon: SvgIcon.Envelope, label: this.i18n.dashboard.action.messages };
      case QuickAccessTypeEnum.SEND_MESSAGE:
        return { icon: SvgIcon.Envelope, label: this.i18n.dashboard.action.sendMessage };
      case QuickAccessTypeEnum.NOTIFICATIONS:
        return { icon: SvgIcon.Bell, label: this.i18n.dashboard.action.notifications };
      case QuickAccessTypeEnum.REFERENCES:
        return { icon: SvgIcon.Star, label: this.i18n.dashboard.action.references };
      case QuickAccessTypeEnum.TRANSACTION_FEEDBACKS:
        return { icon: SvgIcon.Star, label: this.i18n.dashboard.action.feedbacks };
      case QuickAccessTypeEnum.SWITCH_THEME:
        return { icon: SvgIcon.LightDark, label: this.i18n.dashboard.action.switchTheme };
      case QuickAccessTypeEnum.SWITCH_FRONTEND:
        return { icon: SvgIcon.Display, label: this.i18n.dashboard.action.classicFrontend };
      case QuickAccessTypeEnum.SETTINGS:
        return { icon: SvgIcon.Gear, label: this.i18n.dashboard.action.settings };
      case QuickAccessTypeEnum.OPERATION:
        const operation = quickAccess.operation;
        return { icon: this.operationHelper.icon(operation), label: operation.label };
      case QuickAccessTypeEnum.WIZARD:
        const wizard = quickAccess.wizard;
        return { icon: this.wizardHelper.icon(wizard), label: wizard.label };
      case QuickAccessTypeEnum.RECORD:
        const recordType = quickAccess.recordType;
        const recordLabel = recordType.layout === RecordLayoutEnum.SINGLE ? recordType.name : recordType.pluralName;
        return { icon: this.recordHelper.icon(recordType), label: recordLabel };
      case QuickAccessTypeEnum.TOKEN:
        const tokenType = quickAccess.tokenType;
        return { icon: this.tokenHelper.icon(tokenType), label: tokenType.pluralName };
      case QuickAccessTypeEnum.HELP:
        return { icon: SvgIcon.QuestionCircle , label: this.i18n.dashboard.action.help };
    }
  }

}
