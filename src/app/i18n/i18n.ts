/* tslint:disable */
import { Injectable } from '@angular/core';
import { Translations, TranslationValues } from "./translations";
import { BehaviorSubject } from 'rxjs';

/**
 * Translation messages accessor
 */
@Injectable()
export class I18n {

  /**
   * Locales for which translations should be available
   */
  static locales(): string[] {
    return [
      'en',
      'es',
      'nl',
      'pt_BR',
      'fr'
    ];
  }

  /**
   * Returns the file name which contains the translations for the given locale
   */
  static fileName(locale: string): string {
    switch (locale) {
      case 'es': return 'i18n.es.json';
      case 'nl': return 'i18n.nl.json';
      case 'pt_BR': return 'i18n.pt_BR.json';
      case 'fr': return 'i18n.fr.json';
      default: return 'i18n.json';
    }
  }

  /**
   * Returns a hash for the file contents on the moment it was compiled
   */
  static contentHash(locale: string): string {
    switch (locale) {
      case 'es': return '1e1272264d6cbf89b1b1bc33cf63e3af916d26b4';
      case 'nl': return '166d39260c8d55655c9e3f859e9ea81811da6db7';
      case 'pt_BR': return '9d75b34910aae54ad0a719da44a2f56a9c1a3d8e';
      case 'fr': return '820ba18d77d4b5289649fb7c124216b066a12fa9';
      default: return 'daa4bc68e67cc05907c292de86698d3e237de594';
    }
  }

  /** Indicates whether the translation values have been initialized **/
  initialized$ = new BehaviorSubject(false);

  private _translations: Translations = new Translations();

  private _nested = {
    general: new I18n$General(),
    error: new I18n$Error(),
    menu: new I18n$Menu(),
    auth: new I18n$Auth(),
    dashboard: new I18n$Dashboard(),
    account: new I18n$Account(),
    transaction: new I18n$Transaction(),
    field: new I18n$Field(),
    user: new I18n$User(),
    phone: new I18n$Phone(),
    address: new I18n$Address(),
    ad: new I18n$Ad(),
    notification: new I18n$Notification(),
    operation: new I18n$Operation()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.general.initialize(values['general'] || {});
    this._nested.error.initialize(values['error'] || {});
    this._nested.menu.initialize(values['menu'] || {});
    this._nested.auth.initialize(values['auth'] || {});
    this._nested.dashboard.initialize(values['dashboard'] || {});
    this._nested.account.initialize(values['account'] || {});
    this._nested.transaction.initialize(values['transaction'] || {});
    this._nested.field.initialize(values['field'] || {});
    this._nested.user.initialize(values['user'] || {});
    this._nested.phone.initialize(values['phone'] || {});
    this._nested.address.initialize(values['address'] || {});
    this._nested.ad.initialize(values['ad'] || {});
    this._nested.notification.initialize(values['notification'] || {});
    this._nested.operation.initialize(values['operation'] || {});
    this.initialized$.next(true);
  }

  /**
   * Returns the nested accessor for translation messages in `general`.
   */
  get general(): I18n$General {
    return this._nested.general;
  }

  /**
   * Returns the nested accessor for translation messages in `error`.
   */
  get error(): I18n$Error {
    return this._nested.error;
  }

  /**
   * Returns the nested accessor for translation messages in `menu`.
   */
  get menu(): I18n$Menu {
    return this._nested.menu;
  }

  /**
   * Returns the nested accessor for translation messages in `auth`.
   */
  get auth(): I18n$Auth {
    return this._nested.auth;
  }

  /**
   * Returns the nested accessor for translation messages in `dashboard`.
   */
  get dashboard(): I18n$Dashboard {
    return this._nested.dashboard;
  }

  /**
   * Returns the nested accessor for translation messages in `account`.
   */
  get account(): I18n$Account {
    return this._nested.account;
  }

  /**
   * Returns the nested accessor for translation messages in `transaction`.
   */
  get transaction(): I18n$Transaction {
    return this._nested.transaction;
  }

  /**
   * Returns the nested accessor for translation messages in `field`.
   */
  get field(): I18n$Field {
    return this._nested.field;
  }

  /**
   * Returns the nested accessor for translation messages in `user`.
   */
  get user(): I18n$User {
    return this._nested.user;
  }

  /**
   * Returns the nested accessor for translation messages in `phone`.
   */
  get phone(): I18n$Phone {
    return this._nested.phone;
  }

  /**
   * Returns the nested accessor for translation messages in `address`.
   */
  get address(): I18n$Address {
    return this._nested.address;
  }

  /**
   * Returns the nested accessor for translation messages in `ad`.
   */
  get ad(): I18n$Ad {
    return this._nested.ad;
  }

  /**
   * Returns the nested accessor for translation messages in `notification`.
   */
  get notification(): I18n$Notification {
    return this._nested.notification;
  }

  /**
   * Returns the nested accessor for translation messages in `operation`.
   */
  get operation(): I18n$Operation {
    return this._nested.operation;
  }
}

export class I18n$General {

  private _translations: Translations = new Translations('general');

  private _nested = {
    sendMedium: new I18n$General$SendMedium(),
    sessionExpired: new I18n$General$SessionExpired(),
    datePart: new I18n$General$DatePart(),
    month: new I18n$General$Month(),
    weekday: new I18n$General$Weekday(),
    fileSize: new I18n$General$FileSize(),
    results: new I18n$General$Results(),
    geolocation: new I18n$General$Geolocation()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.sendMedium.initialize(values['sendMedium'] || {});
    this._nested.sessionExpired.initialize(values['sessionExpired'] || {});
    this._nested.datePart.initialize(values['datePart'] || {});
    this._nested.month.initialize(values['month'] || {});
    this._nested.weekday.initialize(values['weekday'] || {});
    this._nested.fileSize.initialize(values['fileSize'] || {});
    this._nested.results.initialize(values['results'] || {});
    this._nested.geolocation.initialize(values['geolocation'] || {});
  }

  /**
   * Returns the value of translation message for key `period`.
   * Default value: `Period`
   */
  get period(): string {
    return this._translations.get('period');
  }

  /**
   * Returns the value of translation message for key `now`.
   * Default value: `Now`
   */
  get now(): string {
    return this._translations.get('now');
  }

  /**
   * Returns the value of translation message for key `action`.
   * Default value: `Action`
   */
  get action(): string {
    return this._translations.get('action');
  }

  /**
   * Returns the value of translation message for key `actions`.
   * Default value: `Actions`
   */
  get actions(): string {
    return this._translations.get('actions');
  }

  /**
   * Returns the value of translation message for key `date`.
   * Default value: `Date`
   */
  get date(): string {
    return this._translations.get('date');
  }

  /**
   * Returns the value of translation message for key `performedBy`.
   * Default value: `Performed by`
   */
  get performedBy(): string {
    return this._translations.get('performedBy');
  }

  /**
   * Returns the value of translation message for key `comments`.
   * Default value: `Comments`
   */
  get comments(): string {
    return this._translations.get('comments');
  }

  /**
   * Returns the value of translation message for key `futureDate`.
   * Default value: `Future date`
   */
  get futureDate(): string {
    return this._translations.get('futureDate');
  }

  /**
   * Returns the value of translation message for key `beginDate`.
   * Default value: `Begin date`
   */
  get beginDate(): string {
    return this._translations.get('beginDate');
  }

  /**
   * Returns the value of translation message for key `endDate`.
   * Default value: `End date`
   */
  get endDate(): string {
    return this._translations.get('endDate');
  }

  /**
   * Returns the value of translation message for key `notApplied`.
   * Default value: `Not applied`
   */
  get notApplied(): string {
    return this._translations.get('notApplied');
  }

  /**
   * Returns the value of translation message for key `notAppliedSelect`.
   * Default value: `Not applied (select to apply)`
   */
  get notAppliedSelect(): string {
    return this._translations.get('notAppliedSelect');
  }

  /**
   * Returns the value of translation message for key `user`.
   * Default value: `User`
   */
  get user(): string {
    return this._translations.get('user');
  }

  /**
   * Returns the value of translation message for key `operator`.
   * Default value: `Operator`
   */
  get operator(): string {
    return this._translations.get('operator');
  }

  /**
   * Returns the value of translation message for key `name`.
   * Default value: `Name`
   */
  get name(): string {
    return this._translations.get('name');
  }

  /**
   * Returns the value of translation message for key `description`.
   * Default value: `Description`
   */
  get description(): string {
    return this._translations.get('description');
  }

  /**
   * Returns the value of translation message for key `image`.
   * Default value: `Image`
   */
  get image(): string {
    return this._translations.get('image');
  }

  /**
   * Returns the value of translation message for key `keywords`.
   * Default value: `Keywords`
   */
  get keywords(): string {
    return this._translations.get('keywords');
  }

  /**
   * Returns the value of translation message for key `distanceFilter`.
   * Default value: `Distance`
   */
  get distanceFilter(): string {
    return this._translations.get('distanceFilter');
  }

  /**
   * Returns the value of translation message for key `orderBy`.
   * Default value: `Order by`
   */
  get orderBy(): string {
    return this._translations.get('orderBy');
  }

  /**
   * Returns the value of translation message for key `orderBy.relevance`.
   * Default value: `Relevance`
   */
  get orderByRelevance(): string {
    return this._translations.get('orderBy.relevance');
  }

  /**
   * Returns the value of translation message for key `print`.
   * Default value: `Print`
   */
  get print(): string {
    return this._translations.get('print');
  }

  /**
   * Returns the value of translation message for key `showFilters`.
   * Default value: `Show filters`
   */
  get showFilters(): string {
    return this._translations.get('showFilters');
  }

  /**
   * Returns the value of translation message for key `hideFilters`.
   * Default value: `Hide filters`
   */
  get hideFilters(): string {
    return this._translations.get('hideFilters');
  }

  /**
   * Returns the value of translation message for key `moreFilters`.
   * Default value: `More filters`
   */
  get moreFilters(): string {
    return this._translations.get('moreFilters');
  }

  /**
   * Returns the value of translation message for key `showMoreFilters`.
   * Default value: `Show more filters`
   */
  get showMoreFilters(): string {
    return this._translations.get('showMoreFilters');
  }

  /**
   * Returns the value of translation message for key `lessFilters`.
   * Default value: `Less filters`
   */
  get lessFilters(): string {
    return this._translations.get('lessFilters');
  }

  /**
   * Returns the value of translation message for key `showLessFilters`.
   * Default value: `Show less filters`
   */
  get showLessFilters(): string {
    return this._translations.get('showLessFilters');
  }

  /**
   * Returns the value of translation message for key `previous`.
   * Default value: `Previous`
   */
  get previous(): string {
    return this._translations.get('previous');
  }

  /**
   * Returns the value of translation message for key `next`.
   * Default value: `Next`
   */
  get next(): string {
    return this._translations.get('next');
  }

  /**
   * Returns the value of translation message for key `view`.
   * Default value: `View`
   */
  get view(): string {
    return this._translations.get('view');
  }

  /**
   * Returns the value of translation message for key `edit`.
   * Default value: `Edit`
   */
  get edit(): string {
    return this._translations.get('edit');
  }

  /**
   * Returns the value of translation message for key `confirm`.
   * Default value: `Confirm`
   */
  get confirm(): string {
    return this._translations.get('confirm');
  }

  /**
   * Returns the value of translation message for key `cancel`.
   * Default value: `Cancel`
   */
  get cancel(): string {
    return this._translations.get('cancel');
  }

  /**
   * Returns the value of translation message for key `close`.
   * Default value: `Close`
   */
  get close(): string {
    return this._translations.get('close');
  }

  /**
   * Returns the value of translation message for key `submit`.
   * Default value: `Submit`
   */
  get submit(): string {
    return this._translations.get('submit');
  }

  /**
   * Returns the value of translation message for key `save`.
   * Default value: `Save`
   */
  get save(): string {
    return this._translations.get('save');
  }

  /**
   * Returns the value of translation message for key `addNew`.
   * Default value: `Add new`
   */
  get addNew(): string {
    return this._translations.get('addNew');
  }

  /**
   * Returns the value of translation message for key `yes`.
   * Default value: `Yes`
   */
  get yes(): string {
    return this._translations.get('yes');
  }

  /**
   * Returns the value of translation message for key `no`.
   * Default value: `No`
   */
  get no(): string {
    return this._translations.get('no');
  }

  /**
   * Returns the value of translation message for key `map`.
   * Default value: `Map`
   */
  get map(): string {
    return this._translations.get('map');
  }

  /**
   * Returns the value of translation message for key `map.view`.
   * Default value: `View map`
   */
  get mapView(): string {
    return this._translations.get('map.view');
  }

  /**
   * Returns the value of translation message for key `noOptionsSelected`.
   * Default value: `No options selected`
   */
  get noOptionsSelected(): string {
    return this._translations.get('noOptionsSelected');
  }

  /**
   * Returns the value of translation message for key `labelValue`.
   * Default value: `{label}: {value}`
   */
  labelValue($: {label: string | number, value: string | number}): string {
    return this._translations.get('labelValue', {
      label: $.label,
      value: $.value
    });
  }

  /**
   * Returns the value of translation message for key `reloadPage`.
   * Default value: `Reload page`
   */
  get reloadPage(): string {
    return this._translations.get('reloadPage');
  }

  /**
   * Returns the nested accessor for translation messages in `sendMedium`.
   */
  get sendMedium(): I18n$General$SendMedium {
    return this._nested.sendMedium;
  }

  /**
   * Returns the nested accessor for translation messages in `sessionExpired`.
   */
  get sessionExpired(): I18n$General$SessionExpired {
    return this._nested.sessionExpired;
  }

  /**
   * Returns the nested accessor for translation messages in `datePart`.
   */
  get datePart(): I18n$General$DatePart {
    return this._nested.datePart;
  }

  /**
   * Returns the nested accessor for translation messages in `month`.
   */
  get month(): I18n$General$Month {
    return this._nested.month;
  }

  /**
   * Returns the nested accessor for translation messages in `weekday`.
   */
  get weekday(): I18n$General$Weekday {
    return this._nested.weekday;
  }

  /**
   * Returns the nested accessor for translation messages in `fileSize`.
   */
  get fileSize(): I18n$General$FileSize {
    return this._nested.fileSize;
  }

  /**
   * Returns the nested accessor for translation messages in `results`.
   */
  get results(): I18n$General$Results {
    return this._nested.results;
  }

  /**
   * Returns the nested accessor for translation messages in `geolocation`.
   */
  get geolocation(): I18n$General$Geolocation {
    return this._nested.geolocation;
  }
}

export class I18n$General$SendMedium {

  private _translations: Translations = new Translations('general.sendMedium');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `email`.
   * Default value: `E-mail`
   */
  get email(): string {
    return this._translations.get('email');
  }

  /**
   * Returns the value of translation message for key `sms`.
   * Default value: `SMS`
   */
  get sms(): string {
    return this._translations.get('sms');
  }
}

export class I18n$General$SessionExpired {

  private _translations: Translations = new Translations('general.sessionExpired');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `title`.
   * Default value: `Session expired`
   */
  get title(): string {
    return this._translations.get('title');
  }

  /**
   * Returns the value of translation message for key `message`.
   * Default value: `You have been logged-out.<br>You can keep viewing the same page or login again now.`
   */
  get message(): string {
    return this._translations.get('message');
  }

  /**
   * Returns the value of translation message for key `loginAgain`.
   * Default value: `Login again`
   */
  get loginAgain(): string {
    return this._translations.get('loginAgain');
  }
}

export class I18n$General$DatePart {

  private _translations: Translations = new Translations('general.datePart');

  private _nested = {
    long: new I18n$General$DatePart$Long()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.long.initialize(values['long'] || {});
  }

  /**
   * Returns the nested accessor for translation messages in `long`.
   */
  get long(): I18n$General$DatePart$Long {
    return this._nested.long;
  }
}

export class I18n$General$DatePart$Long {

  private _translations: Translations = new Translations('general.datePart.long');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `year`.
   * Default value: `Year`
   */
  get year(): string {
    return this._translations.get('year');
  }

  /**
   * Returns the value of translation message for key `month`.
   * Default value: `Month`
   */
  get month(): string {
    return this._translations.get('month');
  }

  /**
   * Returns the value of translation message for key `day`.
   * Default value: `Day`
   */
  get day(): string {
    return this._translations.get('day');
  }
}

export class I18n$General$Month {

  private _translations: Translations = new Translations('general.month');

  private _nested = {
    long: new I18n$General$Month$Long(),
    short: new I18n$General$Month$Short()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.long.initialize(values['long'] || {});
    this._nested.short.initialize(values['short'] || {});
  }

  /**
   * Returns the nested accessor for translation messages in `long`.
   */
  get long(): I18n$General$Month$Long {
    return this._nested.long;
  }

  /**
   * Returns the nested accessor for translation messages in `short`.
   */
  get short(): I18n$General$Month$Short {
    return this._nested.short;
  }
}

export class I18n$General$Month$Long {

  private _translations: Translations = new Translations('general.month.long');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `jan`.
   * Default value: `January`
   */
  get jan(): string {
    return this._translations.get('jan');
  }

  /**
   * Returns the value of translation message for key `feb`.
   * Default value: `February`
   */
  get feb(): string {
    return this._translations.get('feb');
  }

  /**
   * Returns the value of translation message for key `mar`.
   * Default value: `March`
   */
  get mar(): string {
    return this._translations.get('mar');
  }

  /**
   * Returns the value of translation message for key `apr`.
   * Default value: `April`
   */
  get apr(): string {
    return this._translations.get('apr');
  }

  /**
   * Returns the value of translation message for key `may`.
   * Default value: `May`
   */
  get may(): string {
    return this._translations.get('may');
  }

  /**
   * Returns the value of translation message for key `jun`.
   * Default value: `June`
   */
  get jun(): string {
    return this._translations.get('jun');
  }

  /**
   * Returns the value of translation message for key `jul`.
   * Default value: `July`
   */
  get jul(): string {
    return this._translations.get('jul');
  }

  /**
   * Returns the value of translation message for key `aug`.
   * Default value: `August`
   */
  get aug(): string {
    return this._translations.get('aug');
  }

  /**
   * Returns the value of translation message for key `sep`.
   * Default value: `September`
   */
  get sep(): string {
    return this._translations.get('sep');
  }

  /**
   * Returns the value of translation message for key `oct`.
   * Default value: `October`
   */
  get oct(): string {
    return this._translations.get('oct');
  }

  /**
   * Returns the value of translation message for key `nov`.
   * Default value: `November`
   */
  get nov(): string {
    return this._translations.get('nov');
  }

  /**
   * Returns the value of translation message for key `dec`.
   * Default value: `December`
   */
  get dec(): string {
    return this._translations.get('dec');
  }
}

export class I18n$General$Month$Short {

  private _translations: Translations = new Translations('general.month.short');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `jan`.
   * Default value: `Jan`
   */
  get jan(): string {
    return this._translations.get('jan');
  }

  /**
   * Returns the value of translation message for key `feb`.
   * Default value: `Feb`
   */
  get feb(): string {
    return this._translations.get('feb');
  }

  /**
   * Returns the value of translation message for key `mar`.
   * Default value: `Mar`
   */
  get mar(): string {
    return this._translations.get('mar');
  }

  /**
   * Returns the value of translation message for key `apr`.
   * Default value: `Apr`
   */
  get apr(): string {
    return this._translations.get('apr');
  }

  /**
   * Returns the value of translation message for key `may`.
   * Default value: `May`
   */
  get may(): string {
    return this._translations.get('may');
  }

  /**
   * Returns the value of translation message for key `jun`.
   * Default value: `Jun`
   */
  get jun(): string {
    return this._translations.get('jun');
  }

  /**
   * Returns the value of translation message for key `jul`.
   * Default value: `Jul`
   */
  get jul(): string {
    return this._translations.get('jul');
  }

  /**
   * Returns the value of translation message for key `aug`.
   * Default value: `Aug`
   */
  get aug(): string {
    return this._translations.get('aug');
  }

  /**
   * Returns the value of translation message for key `sep`.
   * Default value: `Sep`
   */
  get sep(): string {
    return this._translations.get('sep');
  }

  /**
   * Returns the value of translation message for key `oct`.
   * Default value: `Oct`
   */
  get oct(): string {
    return this._translations.get('oct');
  }

  /**
   * Returns the value of translation message for key `nov`.
   * Default value: `Nov`
   */
  get nov(): string {
    return this._translations.get('nov');
  }

  /**
   * Returns the value of translation message for key `dec`.
   * Default value: `Dec`
   */
  get dec(): string {
    return this._translations.get('dec');
  }
}

export class I18n$General$Weekday {

  private _translations: Translations = new Translations('general.weekday');

  private _nested = {
    min: new I18n$General$Weekday$Min()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.min.initialize(values['min'] || {});
  }

  /**
   * Returns the nested accessor for translation messages in `min`.
   */
  get min(): I18n$General$Weekday$Min {
    return this._nested.min;
  }
}

export class I18n$General$Weekday$Min {

  private _translations: Translations = new Translations('general.weekday.min');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `sun`.
   * Default value: `S`
   */
  get sun(): string {
    return this._translations.get('sun');
  }

  /**
   * Returns the value of translation message for key `mon`.
   * Default value: `M`
   */
  get mon(): string {
    return this._translations.get('mon');
  }

  /**
   * Returns the value of translation message for key `tue`.
   * Default value: `T`
   */
  get tue(): string {
    return this._translations.get('tue');
  }

  /**
   * Returns the value of translation message for key `wed`.
   * Default value: `W`
   */
  get wed(): string {
    return this._translations.get('wed');
  }

  /**
   * Returns the value of translation message for key `thu`.
   * Default value: `T`
   */
  get thu(): string {
    return this._translations.get('thu');
  }

  /**
   * Returns the value of translation message for key `fri`.
   * Default value: `F`
   */
  get fri(): string {
    return this._translations.get('fri');
  }

  /**
   * Returns the value of translation message for key `sat`.
   * Default value: `S`
   */
  get sat(): string {
    return this._translations.get('sat');
  }
}

export class I18n$General$FileSize {

  private _translations: Translations = new Translations('general.fileSize');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `b`.
   * Default value: `{n} bytes`
   */
  b(n: string | number): string {
    return this._translations.get('b', {
      n: n
    });
  }

  /**
   * Returns the value of translation message for key `k`.
   * Default value: `{n}KB`
   */
  k(n: string | number): string {
    return this._translations.get('k', {
      n: n
    });
  }

  /**
   * Returns the value of translation message for key `m`.
   * Default value: `{n}MB`
   */
  m(n: string | number): string {
    return this._translations.get('m', {
      n: n
    });
  }
}

export class I18n$General$Results {

  private _translations: Translations = new Translations('general.results');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `withTotal`.
   * Default value: `Showing {first} - {last} of {total} results`
   */
  withTotal($: {first: string | number, last: string | number, total: string | number}): string {
    return this._translations.get('withTotal', {
      first: $.first,
      last: $.last,
      total: $.total
    });
  }

  /**
   * Returns the value of translation message for key `noTotal`.
   * Default value: `Showing {first} - {last} results`
   */
  noTotal($: {first: string | number, last: string | number}): string {
    return this._translations.get('noTotal', {
      first: $.first,
      last: $.last
    });
  }

  /**
   * Returns the value of translation message for key `none`.
   * Default value: `No results match the search criteria`
   */
  get none(): string {
    return this._translations.get('none');
  }
}

export class I18n$General$Geolocation {

  private _translations: Translations = new Translations('general.geolocation');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `kilometersFrom`.
   * Default value: `km from`
   */
  get kilometersFrom(): string {
    return this._translations.get('kilometersFrom');
  }

  /**
   * Returns the value of translation message for key `milesFrom`.
   * Default value: `miles from`
   */
  get milesFrom(): string {
    return this._translations.get('milesFrom');
  }

  /**
   * Returns the value of translation message for key `current`.
   * Default value: `Current location`
   */
  get current(): string {
    return this._translations.get('current');
  }

  /**
   * Returns the value of translation message for key `myAddress`.
   * Default value: `My address`
   */
  get myAddress(): string {
    return this._translations.get('myAddress');
  }

  /**
   * Returns the value of translation message for key `error.denied`.
   * Default value: `No permission to get the current location. Please, grant this permission in your browser.`
   */
  get errorDenied(): string {
    return this._translations.get('error.denied');
  }

  /**
   * Returns the value of translation message for key `error.unavailable`.
   * Default value: `The current location is unavailable`
   */
  get errorUnavailable(): string {
    return this._translations.get('error.unavailable');
  }

  /**
   * Returns the value of translation message for key `error.general`.
   * Default value: `Error getting the current location`
   */
  get errorGeneral(): string {
    return this._translations.get('error.general');
  }
}

export class I18n$Error {

  private _translations: Translations = new Translations('error');

  private _nested = {
    field: new I18n$Error$Field()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.field.initialize(values['field'] || {});
  }

  /**
   * Returns the value of translation message for key `general`.
   * Default value: `There was an unexpected error while processing your request`
   */
  get general(): string {
    return this._translations.get('general');
  }

  /**
   * Returns the value of translation message for key `serverOffline`.
   * Default value: `The server couldn't be contacted.<br>Please, try again later.`
   */
  get serverOffline(): string {
    return this._translations.get('serverOffline');
  }

  /**
   * Returns the value of translation message for key `invalidRequest`.
   * Default value: `It is not possible to connect to the server.<br>Please make sure you are connected to the Internet and try again in a few seconds.`
   */
  get invalidRequest(): string {
    return this._translations.get('invalidRequest');
  }

  /**
   * Returns the value of translation message for key `queryParse`.
   * Default value: `Invalid keywords`
   */
  get queryParse(): string {
    return this._translations.get('queryParse');
  }

  /**
   * Returns the value of translation message for key `uploadSizeExceeded`.
   * Default value: `The uploaded file exceeds the maximum allowed size of {size}`
   */
  uploadSizeExceeded(size: string | number): string {
    return this._translations.get('uploadSizeExceeded', {
      size: size
    });
  }

  /**
   * Returns the value of translation message for key `maxItems`.
   * Default value: `Cannot add more than {max} elements`
   */
  maxItems(max: string | number): string {
    return this._translations.get('maxItems', {
      max: max
    });
  }

  /**
   * Returns the value of translation message for key `validation`.
   * Default value: `The action couldn't be processed, as there were validation errors`
   */
  get validation(): string {
    return this._translations.get('validation');
  }

  /**
   * Returns the value of translation message for key `staleEntity`.
   * Default value: `This data cannot be saved because it has been modified by someone else.<br>Please, load the page again and restart the operation.`
   */
  get staleEntity(): string {
    return this._translations.get('staleEntity');
  }

  /**
   * Returns the value of translation message for key `removeDataInUse`.
   * Default value: `This data cannot be removed because it is currently in use.`
   */
  get removeDataInUse(): string {
    return this._translations.get('removeDataInUse');
  }

  /**
   * Returns the value of translation message for key `notFound`.
   * Default value: `The location you typed or tried to access was not found`
   */
  get notFound(): string {
    return this._translations.get('notFound');
  }

  /**
   * Returns the value of translation message for key `notFound.type`.
   * Default value: `The requested data could not be found: {type}`
   */
  notFoundType(type: string | number): string {
    return this._translations.get('notFound.type', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `notFound.typeKey`.
   * Default value: `The requested data could not be found: {type} with key {key}`
   */
  notFoundTypeKey($: {type: string | number, key: string | number}): string {
    return this._translations.get('notFound.typeKey', {
      type: $.type,
      key: $.key
    });
  }

  /**
   * Returns the value of translation message for key `login`.
   * Default value: `The given name / password are incorrect. Please, try again.`
   */
  get login(): string {
    return this._translations.get('login');
  }

  /**
   * Returns the value of translation message for key `password.disabled`.
   * Default value: `Your password has been disabled. Please, contact the administration.`
   */
  get passwordDisabled(): string {
    return this._translations.get('password.disabled');
  }

  /**
   * Returns the value of translation message for key `password.reset`.
   * Default value: `Your password has been reset.`
   */
  get passwordReset(): string {
    return this._translations.get('password.reset');
  }

  /**
   * Returns the value of translation message for key `password.indefinitelyBlocked`.
   * Default value: `Your password has been disabled by exceeding the maximum tries. Please, contact the administration.`
   */
  get passwordIndefinitelyBlocked(): string {
    return this._translations.get('password.indefinitelyBlocked');
  }

  /**
   * Returns the value of translation message for key `password.temporarilyBlocked`.
   * Default value: `Your password is temporarily blocked by exceeding the maximum tries.`
   */
  get passwordTemporarilyBlocked(): string {
    return this._translations.get('password.temporarilyBlocked');
  }

  /**
   * Returns the value of translation message for key `password.expired`.
   * Default value: `Your password has expired. Please, contact the administration.`
   */
  get passwordExpired(): string {
    return this._translations.get('password.expired');
  }

  /**
   * Returns the value of translation message for key `password.pending`.
   * Default value: `Your password is pending activation. Please, contact the administration.`
   */
  get passwordPending(): string {
    return this._translations.get('password.pending');
  }

  /**
   * Returns the value of translation message for key `password.invalid`.
   * Default value: `The given {type} is invalid`
   */
  passwordInvalid(type: string | number): string {
    return this._translations.get('password.invalid', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `remoteAddressBlocked`.
   * Default value: `Your IP address is blocked for exceeding login attempts`
   */
  get remoteAddressBlocked(): string {
    return this._translations.get('remoteAddressBlocked');
  }

  /**
   * Returns the value of translation message for key `permission`.
   * Default value: `You don't have sufficient permissions to perform the requested action`
   */
  get permission(): string {
    return this._translations.get('permission');
  }

  /**
   * Returns the value of translation message for key `unauthorized.address`.
   * Default value: `Your IP address is not allowed to login`
   */
  get unauthorizedAddress(): string {
    return this._translations.get('unauthorized.address');
  }

  /**
   * Returns the value of translation message for key `unauthorized.url`.
   * Default value: `Access is not allowed from this URL`
   */
  get unauthorizedUrl(): string {
    return this._translations.get('unauthorized.url');
  }

  /**
   * Returns the value of translation message for key `loggedOut`.
   * Default value: `You have been disconnected. Please, login again and repeat the operation.`
   */
  get loggedOut(): string {
    return this._translations.get('loggedOut');
  }

  /**
   * Returns the value of translation message for key `otp`.
   * Default value: `There was an error when sending the password. Please, try again later.`
   */
  get otp(): string {
    return this._translations.get('otp');
  }

  /**
   * Returns the value of translation message for key `securityAnswer`.
   * Default value: `The given security answer is invalid`
   */
  get securityAnswer(): string {
    return this._translations.get('securityAnswer');
  }

  /**
   * Returns the value of translation message for key `securityAnswer.disabled`.
   * Default value: `By exceeding the number of security question attempts, this request has been aborted. Please, contact the administration`
   */
  get securityAnswerDisabled(): string {
    return this._translations.get('securityAnswer.disabled');
  }

  /**
   * Returns the value of translation message for key `illegalAction`.
   * Default value: `The action you attempted to perform is invalid`
   */
  get illegalAction(): string {
    return this._translations.get('illegalAction');
  }

  /**
   * Returns the nested accessor for translation messages in `field`.
   */
  get field(): I18n$Error$Field {
    return this._nested.field;
  }
}

export class I18n$Error$Field {

  private _translations: Translations = new Translations('error.field');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `invalid`.
   * Default value: `This field is invalid`
   */
  get invalid(): string {
    return this._translations.get('invalid');
  }

  /**
   * Returns the value of translation message for key `required`.
   * Default value: `This field is required`
   */
  get required(): string {
    return this._translations.get('required');
  }

  /**
   * Returns the value of translation message for key `passwordsMatch`.
   * Default value: `The passwords don't match`
   */
  get passwordsMatch(): string {
    return this._translations.get('passwordsMatch');
  }

  /**
   * Returns the value of translation message for key `minLength`.
   * Default value: `Should have at least {min} characters`
   */
  minLength(min: string | number): string {
    return this._translations.get('minLength', {
      min: min
    });
  }

  /**
   * Returns the value of translation message for key `number`.
   * Default value: `Invalid numeric value`
   */
  get number(): string {
    return this._translations.get('number');
  }

  /**
   * Returns the value of translation message for key `date`.
   * Default value: `Invalid date`
   */
  get date(): string {
    return this._translations.get('date');
  }

  /**
   * Returns the value of translation message for key `minDate`.
   * Default value: `Should be {min} or after`
   */
  minDate(min: string | number): string {
    return this._translations.get('minDate', {
      min: min
    });
  }

  /**
   * Returns the value of translation message for key `maxDate`.
   * Default value: `Should be {max} or before`
   */
  maxDate(max: string | number): string {
    return this._translations.get('maxDate', {
      max: max
    });
  }
}

export class I18n$Menu {

  private _translations: Translations = new Translations('menu');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `login`.
   * Default value: `Login`
   */
  get login(): string {
    return this._translations.get('login');
  }

  /**
   * Returns the value of translation message for key `register`.
   * Default value: `Register`
   */
  get register(): string {
    return this._translations.get('register');
  }

  /**
   * Returns the value of translation message for key `logout`.
   * Default value: `Logout`
   */
  get logout(): string {
    return this._translations.get('logout');
  }

  /**
   * Returns the value of translation message for key `home`.
   * Default value: `Home`
   */
  get home(): string {
    return this._translations.get('home');
  }

  /**
   * Returns the value of translation message for key `dashboard`.
   * Default value: `Dashboard`
   */
  get dashboard(): string {
    return this._translations.get('dashboard');
  }

  /**
   * Returns the value of translation message for key `banking`.
   * Default value: `Banking`
   */
  get banking(): string {
    return this._translations.get('banking');
  }

  /**
   * Returns the value of translation message for key `banking.payUser`.
   * Default value: `Payment to user`
   */
  get bankingPayUser(): string {
    return this._translations.get('banking.payUser');
  }

  /**
   * Returns the value of translation message for key `banking.paySystem`.
   * Default value: `Payment to system`
   */
  get bankingPaySystem(): string {
    return this._translations.get('banking.paySystem');
  }

  /**
   * Returns the value of translation message for key `banking.paySelf`.
   * Default value: `Payment to self`
   */
  get bankingPaySelf(): string {
    return this._translations.get('banking.paySelf');
  }

  /**
   * Returns the value of translation message for key `banking.scheduledPayments`.
   * Default value: `Scheduled payments`
   */
  get bankingScheduledPayments(): string {
    return this._translations.get('banking.scheduledPayments');
  }

  /**
   * Returns the value of translation message for key `banking.authorizations`.
   * Default value: `Payment authorizations`
   */
  get bankingAuthorizations(): string {
    return this._translations.get('banking.authorizations');
  }

  /**
   * Returns the value of translation message for key `marketplace`.
   * Default value: `Marketplace`
   */
  get marketplace(): string {
    return this._translations.get('marketplace');
  }

  /**
   * Returns the value of translation message for key `marketplace.directory`.
   * Default value: `Directory`
   */
  get marketplaceDirectory(): string {
    return this._translations.get('marketplace.directory');
  }

  /**
   * Returns the value of translation message for key `marketplace.businessDirectory`.
   * Default value: `Business directory`
   */
  get marketplaceBusinessDirectory(): string {
    return this._translations.get('marketplace.businessDirectory');
  }

  /**
   * Returns the value of translation message for key `marketplace.advertisements`.
   * Default value: `Advertisements`
   */
  get marketplaceAdvertisements(): string {
    return this._translations.get('marketplace.advertisements');
  }

  /**
   * Returns the value of translation message for key `personal`.
   * Default value: `Personal`
   */
  get personal(): string {
    return this._translations.get('personal');
  }

  /**
   * Returns the value of translation message for key `personal.viewProfile`.
   * Default value: `My profile`
   */
  get personalViewProfile(): string {
    return this._translations.get('personal.viewProfile');
  }

  /**
   * Returns the value of translation message for key `personal.editProfile`.
   * Default value: `Edit profile`
   */
  get personalEditProfile(): string {
    return this._translations.get('personal.editProfile');
  }

  /**
   * Returns the value of translation message for key `personal.contacts`.
   * Default value: `Contacts`
   */
  get personalContacts(): string {
    return this._translations.get('personal.contacts');
  }

  /**
   * Returns the value of translation message for key `personal.password`.
   * Default value: `Password`
   */
  get personalPassword(): string {
    return this._translations.get('personal.password');
  }

  /**
   * Returns the value of translation message for key `personal.passwords`.
   * Default value: `Passwords`
   */
  get personalPasswords(): string {
    return this._translations.get('personal.passwords');
  }

  /**
   * Returns the value of translation message for key `personal.notifications`.
   * Default value: `Notifications`
   */
  get personalNotifications(): string {
    return this._translations.get('personal.notifications');
  }

  /**
   * Returns the value of translation message for key `content`.
   * Default value: `Information`
   */
  get content(): string {
    return this._translations.get('content');
  }
}

export class I18n$Auth {

  private _translations: Translations = new Translations('auth');

  private _nested = {
    login: new I18n$Auth$Login(),
    password: new I18n$Auth$Password(),
    pendingAgreements: new I18n$Auth$PendingAgreements(),
    securityQuestion: new I18n$Auth$SecurityQuestion()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.login.initialize(values['login'] || {});
    this._nested.password.initialize(values['password'] || {});
    this._nested.pendingAgreements.initialize(values['pendingAgreements'] || {});
    this._nested.securityQuestion.initialize(values['securityQuestion'] || {});
  }

  /**
   * Returns the value of translation message for key `registrationAgreement`.
   * Default value: `Registration agreement`
   */
  get registrationAgreement(): string {
    return this._translations.get('registrationAgreement');
  }

  /**
   * Returns the nested accessor for translation messages in `login`.
   */
  get login(): I18n$Auth$Login {
    return this._nested.login;
  }

  /**
   * Returns the nested accessor for translation messages in `password`.
   */
  get password(): I18n$Auth$Password {
    return this._nested.password;
  }

  /**
   * Returns the nested accessor for translation messages in `pendingAgreements`.
   */
  get pendingAgreements(): I18n$Auth$PendingAgreements {
    return this._nested.pendingAgreements;
  }

  /**
   * Returns the nested accessor for translation messages in `securityQuestion`.
   */
  get securityQuestion(): I18n$Auth$SecurityQuestion {
    return this._nested.securityQuestion;
  }
}

export class I18n$Auth$Login {

  private _translations: Translations = new Translations('auth.login');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `title`.
   * Default value: `Login`
   */
  get title(): string {
    return this._translations.get('title');
  }

  /**
   * Returns the value of translation message for key `message`.
   * Default value: `You can login with your username and password`
   */
  get message(): string {
    return this._translations.get('message');
  }

  /**
   * Returns the value of translation message for key `disconnected`.
   * Default value: `You have been disconnected.<br>Please, login again in order to view the requested page.`
   */
  get disconnected(): string {
    return this._translations.get('disconnected');
  }

  /**
   * Returns the value of translation message for key `principal`.
   * Default value: `User`
   */
  get principal(): string {
    return this._translations.get('principal');
  }

  /**
   * Returns the value of translation message for key `password`.
   * Default value: `Password`
   */
  get password(): string {
    return this._translations.get('password');
  }

  /**
   * Returns the value of translation message for key `forgotPassword`.
   * Default value: `Forgot your password?`
   */
  get forgotPassword(): string {
    return this._translations.get('forgotPassword');
  }

  /**
   * Returns the value of translation message for key `register`.
   * Default value: `Not a user yet? Register here.`
   */
  get register(): string {
    return this._translations.get('register');
  }
}

export class I18n$Auth$Password {

  private _translations: Translations = new Translations('auth.password');

  private _nested = {
    title: new I18n$Auth$Password$Title(),
    forgotten: new I18n$Auth$Password$Forgotten(),
    expired: new I18n$Auth$Password$Expired(),
    status: new I18n$Auth$Password$Status(),
    action: new I18n$Auth$Password$Action()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.title.initialize(values['title'] || {});
    this._nested.forgotten.initialize(values['forgotten'] || {});
    this._nested.expired.initialize(values['expired'] || {});
    this._nested.status.initialize(values['status'] || {});
    this._nested.action.initialize(values['action'] || {});
  }

  /**
   * Returns the value of translation message for key `confirmationMessage`.
   * Default value: `Supply your {passwordType} to confirm this operation`
   */
  confirmationMessage(passwordType: string | number): string {
    return this._translations.get('confirmationMessage', {
      passwordType: passwordType
    });
  }

  /**
   * Returns the value of translation message for key `confirm.noPassword`.
   * Default value: `In order to confirm you need a {passwordType}, but you do not have any`
   */
  confirmNoPassword(passwordType: string | number): string {
    return this._translations.get('confirm.noPassword', {
      passwordType: passwordType
    });
  }

  /**
   * Returns the value of translation message for key `confirm.mode`.
   * Default value: `Confirm with`
   */
  get confirmMode(): string {
    return this._translations.get('confirm.mode');
  }

  /**
   * Returns the value of translation message for key `confirm.mode.device`.
   * Default value: `Mobile phone`
   */
  get confirmModeDevice(): string {
    return this._translations.get('confirm.mode.device');
  }

  /**
   * Returns the value of translation message for key `confirm.mode.password`.
   * Default value: `Password`
   */
  get confirmModePassword(): string {
    return this._translations.get('confirm.mode.password');
  }

  /**
   * Returns the value of translation message for key `confirm.device.active`.
   * Default value: `In order to confirm, scan this QR-code with your mobile phone`
   */
  get confirmDeviceActive(): string {
    return this._translations.get('confirm.device.active');
  }

  /**
   * Returns the value of translation message for key `confirm.device.none`.
   * Default value: `In order to confirm you must have a trusted mobile phone but you do not have any`
   */
  get confirmDeviceNone(): string {
    return this._translations.get('confirm.device.none');
  }

  /**
   * Returns the value of translation message for key `confirm.deviceOrPassword.active`.
   * Default value: `In order to confirm, either scan this QR-code with your mobile phone or supply your {password}`
   */
  confirmDeviceOrPasswordActive(password: string | number): string {
    return this._translations.get('confirm.deviceOrPassword.active', {
      password: password
    });
  }

  /**
   * Returns the value of translation message for key `confirm.deviceOrPassword.none`.
   * Default value: `In order to confirm you must have a trusted mobile phone or supply your {password} but you do not have any`
   */
  confirmDeviceOrPasswordNone(password: string | number): string {
    return this._translations.get('confirm.deviceOrPassword.none', {
      password: password
    });
  }

  /**
   * Returns the value of translation message for key `confirm.deviceOrOtp.noMediums`.
   * Default value: `In order to confirm you need either a trusted mobile phone (and you have none) or a confirmation password, but there are no possible mediums to receive it.<br>Please, contact the administration.`
   */
  get confirmDeviceOrOtpNoMediums(): string {
    return this._translations.get('confirm.deviceOrOtp.noMediums');
  }

  /**
   * Returns the value of translation message for key `confirm.deviceOrOtp.active`.
   * Default value: `In order to confirm, either scan this QR-code with your mobile phone, use the previously sent confirmation password or request a new one`
   */
  get confirmDeviceOrOtpActive(): string {
    return this._translations.get('confirm.deviceOrOtp.active');
  }

  /**
   * Returns the value of translation message for key `confirm.deviceOrOtp.request`.
   * Default value: `In order to confirm, either scan this QR-code with your mobile phone, or request a confirmation password below`
   */
  get confirmDeviceOrOtpRequest(): string {
    return this._translations.get('confirm.deviceOrOtp.request');
  }

  /**
   * Returns the value of translation message for key `confirm.otp.noMediums`.
   * Default value: `In order to confirm you need a confirmation password, but there are no possible mediums to receive it.<br>Please, contact the administration.`
   */
  get confirmOtpNoMediums(): string {
    return this._translations.get('confirm.otp.noMediums');
  }

  /**
   * Returns the value of translation message for key `confirm.otp.active`.
   * Default value: `You can use the previously sent confirmation password or request a new one`
   */
  get confirmOtpActive(): string {
    return this._translations.get('confirm.otp.active');
  }

  /**
   * Returns the value of translation message for key `confirm.otp.request`.
   * Default value: `Please, request a confirmation password below in order to confirm`
   */
  get confirmOtpRequest(): string {
    return this._translations.get('confirm.otp.request');
  }

  /**
   * Returns the value of translation message for key `otp.sent`.
   * Default value: `The password was sent to {dest}`
   */
  otpSent(dest: string | number): string {
    return this._translations.get('otp.sent', {
      dest: dest
    });
  }

  /**
   * Returns the value of translation message for key `oldPassword`.
   * Default value: `Old password`
   */
  get oldPassword(): string {
    return this._translations.get('oldPassword');
  }

  /**
   * Returns the value of translation message for key `newPassword`.
   * Default value: `New password`
   */
  get newPassword(): string {
    return this._translations.get('newPassword');
  }

  /**
   * Returns the value of translation message for key `passwordConfirmation`.
   * Default value: `Password confirmation`
   */
  get passwordConfirmation(): string {
    return this._translations.get('passwordConfirmation');
  }

  /**
   * Returns the value of translation message for key `statusSince`.
   * Default value: `Since {date}`
   */
  statusSince(date: string | number): string {
    return this._translations.get('statusSince', {
      date: date
    });
  }

  /**
   * Returns the nested accessor for translation messages in `title`.
   */
  get title(): I18n$Auth$Password$Title {
    return this._nested.title;
  }

  /**
   * Returns the nested accessor for translation messages in `forgotten`.
   */
  get forgotten(): I18n$Auth$Password$Forgotten {
    return this._nested.forgotten;
  }

  /**
   * Returns the nested accessor for translation messages in `expired`.
   */
  get expired(): I18n$Auth$Password$Expired {
    return this._nested.expired;
  }

  /**
   * Returns the nested accessor for translation messages in `status`.
   */
  get status(): I18n$Auth$Password$Status {
    return this._nested.status;
  }

  /**
   * Returns the nested accessor for translation messages in `action`.
   */
  get action(): I18n$Auth$Password$Action {
    return this._nested.action;
  }
}

export class I18n$Auth$Password$Title {

  private _translations: Translations = new Translations('auth.password.title');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `change`.
   * Default value: `Change your password`
   */
  get change(): string {
    return this._translations.get('change');
  }

  /**
   * Returns the value of translation message for key `manage.single`.
   * Default value: `Manage your password`
   */
  get manageSingle(): string {
    return this._translations.get('manage.single');
  }

  /**
   * Returns the value of translation message for key `manage.multiple`.
   * Default value: `Manage your passwords`
   */
  get manageMultiple(): string {
    return this._translations.get('manage.multiple');
  }
}

export class I18n$Auth$Password$Forgotten {

  private _translations: Translations = new Translations('auth.password.forgotten');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `title`.
   * Default value: `Recover your password`
   */
  get title(): string {
    return this._translations.get('title');
  }

  /**
   * Returns the value of translation message for key `preface`.
   * Default value: `Here you can recover your password. Fill in your user identification below. You can use one of the following:`
   */
  get preface(): string {
    return this._translations.get('preface');
  }

  /**
   * Returns the value of translation message for key `principal`.
   * Default value: `User`
   */
  get principal(): string {
    return this._translations.get('principal');
  }

  /**
   * Returns the value of translation message for key `captcha`.
   * Default value: `Type in the characters below`
   */
  get captcha(): string {
    return this._translations.get('captcha');
  }

  /**
   * Returns the value of translation message for key `email`.
   * Default value: `You will receive shortly an e-mail with your user identification and instructions on how to reset your password`
   */
  get email(): string {
    return this._translations.get('email');
  }

  /**
   * Returns the value of translation message for key `generated.message`.
   * Default value: `Once you submit, a new password will be generated and sent to your e-mail address`
   */
  get generatedMessage(): string {
    return this._translations.get('generated.message');
  }

  /**
   * Returns the value of translation message for key `generated.done`.
   * Default value: `You should receive shortly an e-mail with your new password.`
   */
  get generatedDone(): string {
    return this._translations.get('generated.done');
  }

  /**
   * Returns the value of translation message for key `manual.done`.
   * Default value: `Your password has been successfully changed. You can now use it to login.`
   */
  get manualDone(): string {
    return this._translations.get('manual.done');
  }
}

export class I18n$Auth$Password$Expired {

  private _translations: Translations = new Translations('auth.password.expired');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `preface`.
   * Default value: `Your {type} has expired.`
   */
  preface(type: string | number): string {
    return this._translations.get('preface', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `message.manual`.
   * Default value: `In order to proceed, you must change it.`
   */
  get messageManual(): string {
    return this._translations.get('message.manual');
  }

  /**
   * Returns the value of translation message for key `message.generated`.
   * Default value: `In order to proceed, a new value must be generated.<br>This value will only be displayed once, so, make sure you either memorize it or write it down.`
   */
  get messageGenerated(): string {
    return this._translations.get('message.generated');
  }

  /**
   * Returns the value of translation message for key `generatedValue`.
   * Default value: `The value for {type} is <data>{value}</data>.<br>This value won't be displayed again, so, make sure you either memorize it or write it down.`
   */
  generatedValue($: {type: string | number, value: string | number}): string {
    return this._translations.get('generatedValue', {
      type: $.type,
      value: $.value
    });
  }

  /**
   * Returns the value of translation message for key `generateNew`.
   * Default value: `Generate new`
   */
  get generateNew(): string {
    return this._translations.get('generateNew');
  }

  /**
   * Returns the value of translation message for key `changed`.
   * Default value: `Your {type} was changed`
   */
  changed(type: string | number): string {
    return this._translations.get('changed', {
      type: type
    });
  }
}

export class I18n$Auth$Password$Status {

  private _translations: Translations = new Translations('auth.password.status');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `active`.
   * Default value: `Active`
   */
  get active(): string {
    return this._translations.get('active');
  }

  /**
   * Returns the value of translation message for key `disabled`.
   * Default value: `Disabled`
   */
  get disabled(): string {
    return this._translations.get('disabled');
  }

  /**
   * Returns the value of translation message for key `expired`.
   * Default value: `Expired`
   */
  get expired(): string {
    return this._translations.get('expired');
  }

  /**
   * Returns the value of translation message for key `indefinitelyBlocked`.
   * Default value: `Blocked`
   */
  get indefinitelyBlocked(): string {
    return this._translations.get('indefinitelyBlocked');
  }

  /**
   * Returns the value of translation message for key `neverCreated`.
   * Default value: `Never created`
   */
  get neverCreated(): string {
    return this._translations.get('neverCreated');
  }

  /**
   * Returns the value of translation message for key `pending`.
   * Default value: `Pending`
   */
  get pending(): string {
    return this._translations.get('pending');
  }

  /**
   * Returns the value of translation message for key `reset`.
   * Default value: `Reset`
   */
  get reset(): string {
    return this._translations.get('reset');
  }

  /**
   * Returns the value of translation message for key `temporarilyBlocked`.
   * Default value: `Temporarily blocked`
   */
  get temporarilyBlocked(): string {
    return this._translations.get('temporarilyBlocked');
  }
}

export class I18n$Auth$Password$Action {

  private _translations: Translations = new Translations('auth.password.action');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `change`.
   * Default value: `Change`
   */
  get change(): string {
    return this._translations.get('change');
  }

  /**
   * Returns the value of translation message for key `change.done`.
   * Default value: `Your {type} was changed`
   */
  changeDone(type: string | number): string {
    return this._translations.get('change.done', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `change.generated.confirm`.
   * Default value: `This will generate a new {type}, and the value will be displayed only once. Are you sure?`
   */
  changeGeneratedConfirm(type: string | number): string {
    return this._translations.get('change.generated.confirm', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `change.generated.done`.
   * Default value: `The value for {type} is <data>{value}</data>.<br>Make sure to memorize it, as it won't be displayed again.`
   */
  changeGeneratedDone($: {type: string | number, value: string | number}): string {
    return this._translations.get('change.generated.done', {
      type: $.type,
      value: $.value
    });
  }

  /**
   * Returns the value of translation message for key `unblock`.
   * Default value: `Unblock`
   */
  get unblock(): string {
    return this._translations.get('unblock');
  }

  /**
   * Returns the value of translation message for key `unblock.confirm`.
   * Default value: `Are you sure to unblock your {type}?`
   */
  unblockConfirm(type: string | number): string {
    return this._translations.get('unblock.confirm', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `unblock.done`.
   * Default value: `Your {type} was unblocked`
   */
  unblockDone(type: string | number): string {
    return this._translations.get('unblock.done', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `activate`.
   * Default value: `Activate`
   */
  get activate(): string {
    return this._translations.get('activate');
  }

  /**
   * Returns the value of translation message for key `activate.confirm`.
   * Default value: `This will activate your {type}, and the generated value will be displayed only once. Are you sure?`
   */
  activateConfirm(type: string | number): string {
    return this._translations.get('activate.confirm', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `enable`.
   * Default value: `Enable`
   */
  get enable(): string {
    return this._translations.get('enable');
  }

  /**
   * Returns the value of translation message for key `enable.confirm`.
   * Default value: `Are you sure to enable your {type}?`
   */
  enableConfirm(type: string | number): string {
    return this._translations.get('enable.confirm', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `enable.done`.
   * Default value: `Your {type} was enabled`
   */
  enableDone(type: string | number): string {
    return this._translations.get('enable.done', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `disable`.
   * Default value: `Disable`
   */
  get disable(): string {
    return this._translations.get('disable');
  }

  /**
   * Returns the value of translation message for key `disable.confirm`.
   * Default value: `Are you sure to disable your {type}?`
   */
  disableConfirm(type: string | number): string {
    return this._translations.get('disable.confirm', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `disable.done`.
   * Default value: `Your {type} was disabled`
   */
  disableDone(type: string | number): string {
    return this._translations.get('disable.done', {
      type: type
    });
  }
}

export class I18n$Auth$PendingAgreements {

  private _translations: Translations = new Translations('auth.pendingAgreements');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `title`.
   * Default value: `Updated agreement`
   */
  get title(): string {
    return this._translations.get('title');
  }

  /**
   * Returns the value of translation message for key `message`.
   * Default value: `The registration agreement has been updated.<br><br>In order to continue, you must agree with the new terms.`
   */
  get message(): string {
    return this._translations.get('message');
  }

  /**
   * Returns the value of translation message for key `agree`.
   * Default value: `I agree with the following registration agreements: {agreements}`
   */
  agree(agreements: string | number): string {
    return this._translations.get('agree', {
      agreements: agreements
    });
  }
}

export class I18n$Auth$SecurityQuestion {

  private _translations: Translations = new Translations('auth.securityQuestion');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `question`.
   * Default value: `Security question`
   */
  get question(): string {
    return this._translations.get('question');
  }

  /**
   * Returns the value of translation message for key `answer`.
   * Default value: `Your answer`
   */
  get answer(): string {
    return this._translations.get('answer');
  }
}

export class I18n$Dashboard {

  private _translations: Translations = new Translations('dashboard');

  private _nested = {
    action: new I18n$Dashboard$Action()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.action.initialize(values['action'] || {});
  }

  /**
   * Returns the value of translation message for key `quickAccess`.
   * Default value: `Quick access`
   */
  get quickAccess(): string {
    return this._translations.get('quickAccess');
  }

  /**
   * Returns the value of translation message for key `accountStatus`.
   * Default value: `Account status`
   */
  get accountStatus(): string {
    return this._translations.get('accountStatus');
  }

  /**
   * Returns the value of translation message for key `lastIncomingPayments`.
   * Default value: `Last incoming payments`
   */
  get lastIncomingPayments(): string {
    return this._translations.get('lastIncomingPayments');
  }

  /**
   * Returns the value of translation message for key `noIncomingPayments`.
   * Default value: `No incoming payments`
   */
  get noIncomingPayments(): string {
    return this._translations.get('noIncomingPayments');
  }

  /**
   * Returns the value of translation message for key `latestAds`.
   * Default value: `Latest advertisements`
   */
  get latestAds(): string {
    return this._translations.get('latestAds');
  }

  /**
   * Returns the value of translation message for key `latestUsers`.
   * Default value: `Latest users`
   */
  get latestUsers(): string {
    return this._translations.get('latestUsers');
  }

  /**
   * Returns the nested accessor for translation messages in `action`.
   */
  get action(): I18n$Dashboard$Action {
    return this._nested.action;
  }
}

export class I18n$Dashboard$Action {

  private _translations: Translations = new Translations('dashboard.action');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `account`.
   * Default value: `Account`
   */
  get account(): string {
    return this._translations.get('account');
  }

  /**
   * Returns the value of translation message for key `payUser`.
   * Default value: `Pay user`
   */
  get payUser(): string {
    return this._translations.get('payUser');
  }

  /**
   * Returns the value of translation message for key `paySystem`.
   * Default value: `Pay system`
   */
  get paySystem(): string {
    return this._translations.get('paySystem');
  }

  /**
   * Returns the value of translation message for key `contacts`.
   * Default value: `Contacts`
   */
  get contacts(): string {
    return this._translations.get('contacts');
  }

  /**
   * Returns the value of translation message for key `directory`.
   * Default value: `Directory`
   */
  get directory(): string {
    return this._translations.get('directory');
  }

  /**
   * Returns the value of translation message for key `advertisements`.
   * Default value: `Advertisements`
   */
  get advertisements(): string {
    return this._translations.get('advertisements');
  }

  /**
   * Returns the value of translation message for key `editProfile`.
   * Default value: `Edit profile`
   */
  get editProfile(): string {
    return this._translations.get('editProfile');
  }

  /**
   * Returns the value of translation message for key `password`.
   * Default value: `Password`
   */
  get password(): string {
    return this._translations.get('password');
  }

  /**
   * Returns the value of translation message for key `passwords`.
   * Default value: `Passwords`
   */
  get passwords(): string {
    return this._translations.get('passwords');
  }
}

export class I18n$Account {

  private _translations: Translations = new Translations('account');

  private _nested = {
    orderBy: new I18n$Account$OrderBy()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.orderBy.initialize(values['orderBy'] || {});
  }

  /**
   * Returns the value of translation message for key `number`.
   * Default value: `Account number`
   */
  get number(): string {
    return this._translations.get('number');
  }

  /**
   * Returns the value of translation message for key `transferFilter`.
   * Default value: `Filter`
   */
  get transferFilter(): string {
    return this._translations.get('transferFilter');
  }

  /**
   * Returns the value of translation message for key `minAmount`.
   * Default value: `From amount`
   */
  get minAmount(): string {
    return this._translations.get('minAmount');
  }

  /**
   * Returns the value of translation message for key `maxAmount`.
   * Default value: `To amount`
   */
  get maxAmount(): string {
    return this._translations.get('maxAmount');
  }

  /**
   * Returns the value of translation message for key `direction`.
   * Default value: `Direction`
   */
  get direction(): string {
    return this._translations.get('direction');
  }

  /**
   * Returns the value of translation message for key `incoming`.
   * Default value: `Incoming`
   */
  get incoming(): string {
    return this._translations.get('incoming');
  }

  /**
   * Returns the value of translation message for key `outgoing`.
   * Default value: `Outgoing`
   */
  get outgoing(): string {
    return this._translations.get('outgoing');
  }

  /**
   * Returns the value of translation message for key `balance`.
   * Default value: `Balance`
   */
  get balance(): string {
    return this._translations.get('balance');
  }

  /**
   * Returns the value of translation message for key `reservedAmount`.
   * Default value: `Reserved amount`
   */
  get reservedAmount(): string {
    return this._translations.get('reservedAmount');
  }

  /**
   * Returns the value of translation message for key `availableBalance`.
   * Default value: `Available balance`
   */
  get availableBalance(): string {
    return this._translations.get('availableBalance');
  }

  /**
   * Returns the value of translation message for key `negativeLimit`.
   * Default value: `Negative limit`
   */
  get negativeLimit(): string {
    return this._translations.get('negativeLimit');
  }

  /**
   * Returns the value of translation message for key `positiveLimit`.
   * Default value: `Positive limit`
   */
  get positiveLimit(): string {
    return this._translations.get('positiveLimit');
  }

  /**
   * Returns the value of translation message for key `balanceOn`.
   * Default value: `Balance on {date}`
   */
  balanceOn(date: string | number): string {
    return this._translations.get('balanceOn', {
      date: date
    });
  }

  /**
   * Returns the value of translation message for key `totalIncome`.
   * Default value: `Total income`
   */
  get totalIncome(): string {
    return this._translations.get('totalIncome');
  }

  /**
   * Returns the value of translation message for key `totalOutflow`.
   * Default value: `Total outflow`
   */
  get totalOutflow(): string {
    return this._translations.get('totalOutflow');
  }

  /**
   * Returns the value of translation message for key `netInflow`.
   * Default value: `Net inflow`
   */
  get netInflow(): string {
    return this._translations.get('netInflow');
  }

  /**
   * Returns the value of translation message for key `noAccounts`.
   * Default value: `You have no accounts`
   */
  get noAccounts(): string {
    return this._translations.get('noAccounts');
  }

  /**
   * Returns the value of translation message for key `printTransactions`.
   * Default value: `Print transactions`
   */
  get printTransactions(): string {
    return this._translations.get('printTransactions');
  }

  /**
   * Returns the value of translation message for key `system`.
   * Default value: `System account`
   */
  get system(): string {
    return this._translations.get('system');
  }

  /**
   * Returns the nested accessor for translation messages in `orderBy`.
   */
  get orderBy(): I18n$Account$OrderBy {
    return this._nested.orderBy;
  }
}

export class I18n$Account$OrderBy {

  private _translations: Translations = new Translations('account.orderBy');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `dateDesc`.
   * Default value: `Date (newest first)`
   */
  get dateDesc(): string {
    return this._translations.get('dateDesc');
  }

  /**
   * Returns the value of translation message for key `dateAsc`.
   * Default value: `Date (oldest first)`
   */
  get dateAsc(): string {
    return this._translations.get('dateAsc');
  }

  /**
   * Returns the value of translation message for key `amountAsc`.
   * Default value: `Amount (lowest first)`
   */
  get amountAsc(): string {
    return this._translations.get('amountAsc');
  }

  /**
   * Returns the value of translation message for key `amountDesc`.
   * Default value: `Amount (highest first)`
   */
  get amountDesc(): string {
    return this._translations.get('amountDesc');
  }
}

export class I18n$Transaction {

  private _translations: Translations = new Translations('transaction');

  private _nested = {
    schedulingStatus: new I18n$Transaction$SchedulingStatus(),
    status: new I18n$Transaction$Status(),
    title: new I18n$Transaction$Title(),
    error: new I18n$Transaction$Error()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.schedulingStatus.initialize(values['schedulingStatus'] || {});
    this._nested.status.initialize(values['status'] || {});
    this._nested.title.initialize(values['title'] || {});
    this._nested.error.initialize(values['error'] || {});
  }

  /**
   * Returns the value of translation message for key `number`.
   * Default value: `Transaction number`
   */
  get number(): string {
    return this._translations.get('number');
  }

  /**
   * Returns the value of translation message for key `amount`.
   * Default value: `Amount`
   */
  get amount(): string {
    return this._translations.get('amount');
  }

  /**
   * Returns the value of translation message for key `type`.
   * Default value: `Payment type`
   */
  get type(): string {
    return this._translations.get('type');
  }

  /**
   * Returns the value of translation message for key `fromTo`.
   * Default value: `From / to`
   */
  get fromTo(): string {
    return this._translations.get('fromTo');
  }

  /**
   * Returns the value of translation message for key `from`.
   * Default value: `From`
   */
  get from(): string {
    return this._translations.get('from');
  }

  /**
   * Returns the value of translation message for key `to`.
   * Default value: `To`
   */
  get to(): string {
    return this._translations.get('to');
  }

  /**
   * Returns the value of translation message for key `account`.
   * Default value: `Account`
   */
  get account(): string {
    return this._translations.get('account');
  }

  /**
   * Returns the value of translation message for key `fromAccount`.
   * Default value: `From account`
   */
  get fromAccount(): string {
    return this._translations.get('fromAccount');
  }

  /**
   * Returns the value of translation message for key `toAccount`.
   * Default value: `To account`
   */
  get toAccount(): string {
    return this._translations.get('toAccount');
  }

  /**
   * Returns the value of translation message for key `toUser`.
   * Default value: `To user`
   */
  get toUser(): string {
    return this._translations.get('toUser');
  }

  /**
   * Returns the value of translation message for key `requiresAuthorization`.
   * Default value: `The payment will require authorization`
   */
  get requiresAuthorization(): string {
    return this._translations.get('requiresAuthorization');
  }

  /**
   * Returns the value of translation message for key `appliedFees`.
   * Default value: `Applied fees`
   */
  get appliedFees(): string {
    return this._translations.get('appliedFees');
  }

  /**
   * Returns the value of translation message for key `totalAmount`.
   * Default value: `Total amount`
   */
  get totalAmount(): string {
    return this._translations.get('totalAmount');
  }

  /**
   * Returns the value of translation message for key `dueAmount`.
   * Default value: `Due amount`
   */
  get dueAmount(): string {
    return this._translations.get('dueAmount');
  }

  /**
   * Returns the value of translation message for key `dueDate`.
   * Default value: `Due date`
   */
  get dueDate(): string {
    return this._translations.get('dueDate');
  }

  /**
   * Returns the value of translation message for key `nextOccurrence`.
   * Default value: `Next occurrence`
   */
  get nextOccurrence(): string {
    return this._translations.get('nextOccurrence');
  }

  /**
   * Returns the value of translation message for key `channel`.
   * Default value: `Channel`
   */
  get channel(): string {
    return this._translations.get('channel');
  }

  /**
   * Returns the value of translation message for key `receivedBy`.
   * Default value: `Received by`
   */
  get receivedBy(): string {
    return this._translations.get('receivedBy');
  }

  /**
   * Returns the value of translation message for key `chargebackOf`.
   * Default value: `Chargeback of`
   */
  get chargebackOf(): string {
    return this._translations.get('chargebackOf');
  }

  /**
   * Returns the value of translation message for key `chargedBackBy`.
   * Default value: `Charged back by`
   */
  get chargedBackBy(): string {
    return this._translations.get('chargedBackBy');
  }

  /**
   * Returns the value of translation message for key `authorizationComments`.
   * Default value: `Authorization comments`
   */
  get authorizationComments(): string {
    return this._translations.get('authorizationComments');
  }

  /**
   * Returns the value of translation message for key `accountBalance`.
   * Default value: `Account balance`
   */
  get accountBalance(): string {
    return this._translations.get('accountBalance');
  }

  /**
   * Returns the value of translation message for key `myAccountBalance`.
   * Default value: `My account balance`
   */
  get myAccountBalance(): string {
    return this._translations.get('myAccountBalance');
  }

  /**
   * Returns the value of translation message for key `installments`.
   * Default value: `Installments`
   */
  get installments(): string {
    return this._translations.get('installments');
  }

  /**
   * Returns the value of translation message for key `installmentNumber`.
   * Default value: `Number`
   */
  get installmentNumber(): string {
    return this._translations.get('installmentNumber');
  }

  /**
   * Returns the value of translation message for key `occurrences`.
   * Default value: `Ocurrences`
   */
  get occurrences(): string {
    return this._translations.get('occurrences');
  }

  /**
   * Returns the value of translation message for key `noAccounts`.
   * Default value: `You don't have any accounts to perform the payment`
   */
  get noAccounts(): string {
    return this._translations.get('noAccounts');
  }

  /**
   * Returns the value of translation message for key `noTypes`.
   * Default value: `There are no possible payment types`
   */
  get noTypes(): string {
    return this._translations.get('noTypes');
  }

  /**
   * Returns the value of translation message for key `noTypesSelection`.
   * Default value: `There are no possible payment types from this account to the selected user`
   */
  get noTypesSelection(): string {
    return this._translations.get('noTypesSelection');
  }

  /**
   * Returns the value of translation message for key `scheduling`.
   * Default value: `Scheduling`
   */
  get scheduling(): string {
    return this._translations.get('scheduling');
  }

  /**
   * Returns the value of translation message for key `scheduling.direct`.
   * Default value: `Pay now`
   */
  get schedulingDirect(): string {
    return this._translations.get('scheduling.direct');
  }

  /**
   * Returns the value of translation message for key `scheduling.single`.
   * Default value: `Scheduled`
   */
  get schedulingSingle(): string {
    return this._translations.get('scheduling.single');
  }

  /**
   * Returns the value of translation message for key `scheduling.installments`.
   * Default value: `Monthly installments`
   */
  get schedulingInstallments(): string {
    return this._translations.get('scheduling.installments');
  }

  /**
   * Returns the value of translation message for key `scheduling.recurring`.
   * Default value: `Repeat monthly`
   */
  get schedulingRecurring(): string {
    return this._translations.get('scheduling.recurring');
  }

  /**
   * Returns the value of translation message for key `recurringPayment`.
   * Default value: `Recurring payment`
   */
  get recurringPayment(): string {
    return this._translations.get('recurringPayment');
  }

  /**
   * Returns the value of translation message for key `recurringPayment.nowManual`.
   * Default value: `Repeats until manually canceled, starting now`
   */
  get recurringPaymentNowManual(): string {
    return this._translations.get('recurringPayment.nowManual');
  }

  /**
   * Returns the value of translation message for key `recurringPayment.dateManual`.
   * Default value: `Repeats until manually canceled, starting at {date}`
   */
  recurringPaymentDateManual(date: string | number): string {
    return this._translations.get('recurringPayment.dateManual', {
      date: date
    });
  }

  /**
   * Returns the value of translation message for key `recurringPayment.nowFixed`.
   * Default value: `Repeats {count} times, starting now`
   */
  recurringPaymentNowFixed(count: string | number): string {
    return this._translations.get('recurringPayment.nowFixed', {
      count: count
    });
  }

  /**
   * Returns the value of translation message for key `recurringPayment.dateFixed`.
   * Default value: `Repeats {count} times, starting at {date}`
   */
  recurringPaymentDateFixed($: {count: string | number, date: string | number}): string {
    return this._translations.get('recurringPayment.dateFixed', {
      count: $.count,
      date: $.date
    });
  }

  /**
   * Returns the value of translation message for key `installmentsCount`.
   * Default value: `Number of installments`
   */
  get installmentsCount(): string {
    return this._translations.get('installmentsCount');
  }

  /**
   * Returns the value of translation message for key `firstInstallment`.
   * Default value: `First installment`
   */
  get firstInstallment(): string {
    return this._translations.get('firstInstallment');
  }

  /**
   * Returns the value of translation message for key `firstInstallment.date`.
   * Default value: `First installment date`
   */
  get firstInstallmentDate(): string {
    return this._translations.get('firstInstallment.date');
  }

  /**
   * Returns the value of translation message for key `repeatUntil`.
   * Default value: `Repeat until`
   */
  get repeatUntil(): string {
    return this._translations.get('repeatUntil');
  }

  /**
   * Returns the value of translation message for key `repeatUntil.manual`.
   * Default value: `Manually canceled`
   */
  get repeatUntilManual(): string {
    return this._translations.get('repeatUntil.manual');
  }

  /**
   * Returns the value of translation message for key `repeatUntil.fixed`.
   * Default value: `Fixed number of occurrences`
   */
  get repeatUntilFixed(): string {
    return this._translations.get('repeatUntil.fixed');
  }

  /**
   * Returns the value of translation message for key `occurrencesCount`.
   * Default value: `Number of occurrences`
   */
  get occurrencesCount(): string {
    return this._translations.get('occurrencesCount');
  }

  /**
   * Returns the value of translation message for key `firstOccurrence`.
   * Default value: `First occurrence`
   */
  get firstOccurrence(): string {
    return this._translations.get('firstOccurrence');
  }

  /**
   * Returns the value of translation message for key `firstOccurrence.date`.
   * Default value: `First occurrence date`
   */
  get firstOccurrenceDate(): string {
    return this._translations.get('firstOccurrence.date');
  }

  /**
   * Returns the value of translation message for key `processed`.
   * Default value: `The payment was successfully processed`
   */
  get processed(): string {
    return this._translations.get('processed');
  }

  /**
   * Returns the value of translation message for key `processed.withNumber`.
   * Default value: `The payment with transaction number {number} was successfully processed`
   */
  processedWithNumber(number: string | number): string {
    return this._translations.get('processed.withNumber', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `pending`.
   * Default value: `The payment was submitted for further authorization`
   */
  get pending(): string {
    return this._translations.get('pending');
  }

  /**
   * Returns the value of translation message for key `pending.withNumber`.
   * Default value: `The payment with transaction number {number} was submitted for further authorization`
   */
  pendingWithNumber(number: string | number): string {
    return this._translations.get('pending.withNumber', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `done.view`.
   * Default value: `View payment`
   */
  get doneView(): string {
    return this._translations.get('done.view');
  }

  /**
   * Returns the value of translation message for key `done.new`.
   * Default value: `New payment`
   */
  get doneNew(): string {
    return this._translations.get('done.new');
  }

  /**
   * Returns the value of translation message for key `viewAuthorizations`.
   * Default value: `View authorizations`
   */
  get viewAuthorizations(): string {
    return this._translations.get('viewAuthorizations');
  }

  /**
   * Returns the value of translation message for key `viewThisTransfer`.
   * Default value: `View this transfer`
   */
  get viewThisTransfer(): string {
    return this._translations.get('viewThisTransfer');
  }

  /**
   * Returns the value of translation message for key `authorizePending`.
   * Default value: `Authorize pending payment`
   */
  get authorizePending(): string {
    return this._translations.get('authorizePending');
  }

  /**
   * Returns the value of translation message for key `authorizePending.done.stillPending`.
   * Default value: `The payment still needs another authorization in order to be processed`
   */
  get authorizePendingDoneStillPending(): string {
    return this._translations.get('authorizePending.done.stillPending');
  }

  /**
   * Returns the value of translation message for key `authorizePending.done`.
   * Default value: `The payment was authorized`
   */
  get authorizePendingDone(): string {
    return this._translations.get('authorizePending.done');
  }

  /**
   * Returns the value of translation message for key `denyPending`.
   * Default value: `Deny pending payment`
   */
  get denyPending(): string {
    return this._translations.get('denyPending');
  }

  /**
   * Returns the value of translation message for key `denyPending.done`.
   * Default value: `The payment was denied`
   */
  get denyPendingDone(): string {
    return this._translations.get('denyPending.done');
  }

  /**
   * Returns the value of translation message for key `cancelAuthorization`.
   * Default value: `Cancel the authorization process`
   */
  get cancelAuthorization(): string {
    return this._translations.get('cancelAuthorization');
  }

  /**
   * Returns the value of translation message for key `cancelAuthorization.done`.
   * Default value: `The payment authorization was canceled`
   */
  get cancelAuthorizationDone(): string {
    return this._translations.get('cancelAuthorization.done');
  }

  /**
   * Returns the value of translation message for key `blockScheduling`.
   * Default value: `Block scheduling`
   */
  get blockScheduling(): string {
    return this._translations.get('blockScheduling');
  }

  /**
   * Returns the value of translation message for key `blockScheduling.message`.
   * Default value: `This will prevent scheduled installments from being automatically processed`
   */
  get blockSchedulingMessage(): string {
    return this._translations.get('blockScheduling.message');
  }

  /**
   * Returns the value of translation message for key `blockScheduling.done`.
   * Default value: `This scheduled payment will no longer be automatically processed`
   */
  get blockSchedulingDone(): string {
    return this._translations.get('blockScheduling.done');
  }

  /**
   * Returns the value of translation message for key `unblockScheduling`.
   * Default value: `Unblock scheduling`
   */
  get unblockScheduling(): string {
    return this._translations.get('unblockScheduling');
  }

  /**
   * Returns the value of translation message for key `unblockScheduling.message`.
   * Default value: `This will resume automatic processing for scheduled installments`
   */
  get unblockSchedulingMessage(): string {
    return this._translations.get('unblockScheduling.message');
  }

  /**
   * Returns the value of translation message for key `unblockScheduling.done`.
   * Default value: `This scheduled payment will be automatically processed`
   */
  get unblockSchedulingDone(): string {
    return this._translations.get('unblockScheduling.done');
  }

  /**
   * Returns the value of translation message for key `cancelScheduled`.
   * Default value: `Cancel this scheduled payment`
   */
  get cancelScheduled(): string {
    return this._translations.get('cancelScheduled');
  }

  /**
   * Returns the value of translation message for key `cancelScheduled.message`.
   * Default value: `This will permanently cancel this scheduled payment`
   */
  get cancelScheduledMessage(): string {
    return this._translations.get('cancelScheduled.message');
  }

  /**
   * Returns the value of translation message for key `cancelScheduled.done`.
   * Default value: `This scheduled payment has been canceled`
   */
  get cancelScheduledDone(): string {
    return this._translations.get('cancelScheduled.done');
  }

  /**
   * Returns the value of translation message for key `settleScheduled`.
   * Default value: `Settle the scheduled payment`
   */
  get settleScheduled(): string {
    return this._translations.get('settleScheduled');
  }

  /**
   * Returns the value of translation message for key `settleScheduled.message`.
   * Default value: `This will permanently mark all remaining installments as settled`
   */
  get settleScheduledMessage(): string {
    return this._translations.get('settleScheduled.message');
  }

  /**
   * Returns the value of translation message for key `settleScheduled.done`.
   * Default value: `This scheduled payment has been settled`
   */
  get settleScheduledDone(): string {
    return this._translations.get('settleScheduled.done');
  }

  /**
   * Returns the value of translation message for key `cancelRecurring`.
   * Default value: `Cancel this recurring payment`
   */
  get cancelRecurring(): string {
    return this._translations.get('cancelRecurring');
  }

  /**
   * Returns the value of translation message for key `cancelRecurring.message`.
   * Default value: `This will permanently cancel the recurring payment and prevent any future occurrence`
   */
  get cancelRecurringMessage(): string {
    return this._translations.get('cancelRecurring.message');
  }

  /**
   * Returns the value of translation message for key `cancelRecurring.done`.
   * Default value: `This recurring payment has been canceled`
   */
  get cancelRecurringDone(): string {
    return this._translations.get('cancelRecurring.done');
  }

  /**
   * Returns the value of translation message for key `chargebackTransfer`.
   * Default value: `Chargeback this transfer`
   */
  get chargebackTransfer(): string {
    return this._translations.get('chargebackTransfer');
  }

  /**
   * Returns the value of translation message for key `chargebackTransfer.message`.
   * Default value: `This will return the amount of this transfer to the payer`
   */
  get chargebackTransferMessage(): string {
    return this._translations.get('chargebackTransfer.message');
  }

  /**
   * Returns the value of translation message for key `chargebackTransfer.done`.
   * Default value: `This transfer was charged back`
   */
  get chargebackTransferDone(): string {
    return this._translations.get('chargebackTransfer.done');
  }

  /**
   * Returns the value of translation message for key `processInstallment`.
   * Default value: `Process this installment`
   */
  get processInstallment(): string {
    return this._translations.get('processInstallment');
  }

  /**
   * Returns the value of translation message for key `processInstallment.message`.
   * Default value: `Are you sure to process now the installment number {number}?`
   */
  processInstallmentMessage(number: string | number): string {
    return this._translations.get('processInstallment.message', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `processInstallment.done`.
   * Default value: `The installment was processed`
   */
  get processInstallmentDone(): string {
    return this._translations.get('processInstallment.done');
  }

  /**
   * Returns the value of translation message for key `settleInstallment`.
   * Default value: `Settle this installment`
   */
  get settleInstallment(): string {
    return this._translations.get('settleInstallment');
  }

  /**
   * Returns the value of translation message for key `settleInstallment.message`.
   * Default value: `Are you sure to settle the installment number {number}?`
   */
  settleInstallmentMessage(number: string | number): string {
    return this._translations.get('settleInstallment.message', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `settleInstallment.done`.
   * Default value: `The installment was settled`
   */
  get settleInstallmentDone(): string {
    return this._translations.get('settleInstallment.done');
  }

  /**
   * Returns the value of translation message for key `processFailedOccurrence`.
   * Default value: `Process this failed occurrence`
   */
  get processFailedOccurrence(): string {
    return this._translations.get('processFailedOccurrence');
  }

  /**
   * Returns the value of translation message for key `processFailedOccurrence.message`.
   * Default value: `Are you sure to process now the occurrence number {number}?`
   */
  processFailedOccurrenceMessage(number: string | number): string {
    return this._translations.get('processFailedOccurrence.message', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `processFailedOccurrence.done`.
   * Default value: `The occurrence was processed`
   */
  get processFailedOccurrenceDone(): string {
    return this._translations.get('processFailedOccurrence.done');
  }

  /**
   * Returns the nested accessor for translation messages in `schedulingStatus`.
   */
  get schedulingStatus(): I18n$Transaction$SchedulingStatus {
    return this._nested.schedulingStatus;
  }

  /**
   * Returns the nested accessor for translation messages in `status`.
   */
  get status(): I18n$Transaction$Status {
    return this._nested.status;
  }

  /**
   * Returns the nested accessor for translation messages in `title`.
   */
  get title(): I18n$Transaction$Title {
    return this._nested.title;
  }

  /**
   * Returns the nested accessor for translation messages in `error`.
   */
  get error(): I18n$Transaction$Error {
    return this._nested.error;
  }
}

export class I18n$Transaction$SchedulingStatus {

  private _translations: Translations = new Translations('transaction.schedulingStatus');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `direct`.
   * Default value: `Direct payment`
   */
  get direct(): string {
    return this._translations.get('direct');
  }

  /**
   * Returns the value of translation message for key `scheduledToDate`.
   * Default value: `Scheduled to {date}`
   */
  scheduledToDate(date: string | number): string {
    return this._translations.get('scheduledToDate', {
      date: date
    });
  }

  /**
   * Returns the value of translation message for key `openInstallments`.
   * Default value: `{count} installments, next on {dueDate}`
   */
  openInstallments($: {count: string | number, dueDate: string | number}): string {
    return this._translations.get('openInstallments', {
      count: $.count,
      dueDate: $.dueDate
    });
  }

  /**
   * Returns the value of translation message for key `closedInstallments`.
   * Default value: `{count} installments`
   */
  closedInstallments(count: string | number): string {
    return this._translations.get('closedInstallments', {
      count: count
    });
  }

  /**
   * Returns the value of translation message for key `closedRecurring`.
   * Default value: `Closed recurring payment`
   */
  get closedRecurring(): string {
    return this._translations.get('closedRecurring');
  }

  /**
   * Returns the value of translation message for key `canceledRecurring`.
   * Default value: `Canceled recurring payment`
   */
  get canceledRecurring(): string {
    return this._translations.get('canceledRecurring');
  }

  /**
   * Returns the value of translation message for key `openRecurring`.
   * Default value: `Recurring payment, next on {date}`
   */
  openRecurring(date: string | number): string {
    return this._translations.get('openRecurring', {
      date: date
    });
  }
}

export class I18n$Transaction$Status {

  private _translations: Translations = new Translations('transaction.status');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `name`.
   * Default value: `Status`
   */
  get name(): string {
    return this._translations.get('name');
  }

  /**
   * Returns the value of translation message for key `open`.
   * Default value: `Open`
   */
  get open(): string {
    return this._translations.get('open');
  }

  /**
   * Returns the value of translation message for key `closed`.
   * Default value: `Closed`
   */
  get closed(): string {
    return this._translations.get('closed');
  }

  /**
   * Returns the value of translation message for key `canceled`.
   * Default value: `Canceled`
   */
  get canceled(): string {
    return this._translations.get('canceled');
  }

  /**
   * Returns the value of translation message for key `expired`.
   * Default value: `Expired`
   */
  get expired(): string {
    return this._translations.get('expired');
  }

  /**
   * Returns the value of translation message for key `approved`.
   * Default value: `Approved`
   */
  get approved(): string {
    return this._translations.get('approved');
  }

  /**
   * Returns the value of translation message for key `processed`.
   * Default value: `Processed`
   */
  get processed(): string {
    return this._translations.get('processed');
  }

  /**
   * Returns the value of translation message for key `authorized`.
   * Default value: `Authorized`
   */
  get authorized(): string {
    return this._translations.get('authorized');
  }

  /**
   * Returns the value of translation message for key `pending`.
   * Default value: `Pending authorization`
   */
  get pending(): string {
    return this._translations.get('pending');
  }

  /**
   * Returns the value of translation message for key `denied`.
   * Default value: `Denied`
   */
  get denied(): string {
    return this._translations.get('denied');
  }

  /**
   * Returns the value of translation message for key `blocked`.
   * Default value: `Blocked`
   */
  get blocked(): string {
    return this._translations.get('blocked');
  }

  /**
   * Returns the value of translation message for key `scheduled`.
   * Default value: `Scheduled`
   */
  get scheduled(): string {
    return this._translations.get('scheduled');
  }

  /**
   * Returns the value of translation message for key `failed`.
   * Default value: `Failed`
   */
  get failed(): string {
    return this._translations.get('failed');
  }

  /**
   * Returns the value of translation message for key `settled`.
   * Default value: `Settled`
   */
  get settled(): string {
    return this._translations.get('settled');
  }
}

export class I18n$Transaction$Title {

  private _translations: Translations = new Translations('transaction.title');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `paymentToSystem`.
   * Default value: `Payment to system`
   */
  get paymentToSystem(): string {
    return this._translations.get('paymentToSystem');
  }

  /**
   * Returns the value of translation message for key `paymentToSelf`.
   * Default value: `Payment between own accounts`
   */
  get paymentToSelf(): string {
    return this._translations.get('paymentToSelf');
  }

  /**
   * Returns the value of translation message for key `paymentToUser`.
   * Default value: `Payment to user`
   */
  get paymentToUser(): string {
    return this._translations.get('paymentToUser');
  }

  /**
   * Returns the value of translation message for key `paymentConfirmation`.
   * Default value: `Payment confirmation`
   */
  get paymentConfirmation(): string {
    return this._translations.get('paymentConfirmation');
  }

  /**
   * Returns the value of translation message for key `pendingPayment`.
   * Default value: `Payment submitted for authorization`
   */
  get pendingPayment(): string {
    return this._translations.get('pendingPayment');
  }

  /**
   * Returns the value of translation message for key `processedPayment`.
   * Default value: `Payment performed`
   */
  get processedPayment(): string {
    return this._translations.get('processedPayment');
  }

  /**
   * Returns the value of translation message for key `authorizations`.
   * Default value: `Payment authorizations`
   */
  get authorizations(): string {
    return this._translations.get('authorizations');
  }

  /**
   * Returns the value of translation message for key `authorizationHistory`.
   * Default value: `Authorization history`
   */
  get authorizationHistory(): string {
    return this._translations.get('authorizationHistory');
  }

  /**
   * Returns the value of translation message for key `scheduled`.
   * Default value: `Scheduled payments`
   */
  get scheduled(): string {
    return this._translations.get('scheduled');
  }

  /**
   * Returns the value of translation message for key `details.payment`.
   * Default value: `Payment details`
   */
  get detailsPayment(): string {
    return this._translations.get('details.payment');
  }

  /**
   * Returns the value of translation message for key `details.scheduled`.
   * Default value: `Scheduled payment details`
   */
  get detailsScheduled(): string {
    return this._translations.get('details.scheduled');
  }

  /**
   * Returns the value of translation message for key `details.recurring`.
   * Default value: `Recurring payment details`
   */
  get detailsRecurring(): string {
    return this._translations.get('details.recurring');
  }

  /**
   * Returns the value of translation message for key `details.request`.
   * Default value: `Payment request details`
   */
  get detailsRequest(): string {
    return this._translations.get('details.request');
  }

  /**
   * Returns the value of translation message for key `details.chargeback`.
   * Default value: `Chargeback details`
   */
  get detailsChargeback(): string {
    return this._translations.get('details.chargeback');
  }

  /**
   * Returns the value of translation message for key `details.ticket`.
   * Default value: `Ticket details`
   */
  get detailsTicket(): string {
    return this._translations.get('details.ticket');
  }

  /**
   * Returns the value of translation message for key `details.external`.
   * Default value: `External payment details`
   */
  get detailsExternal(): string {
    return this._translations.get('details.external');
  }

  /**
   * Returns the value of translation message for key `details.transfer`.
   * Default value: `Transfer details`
   */
  get detailsTransfer(): string {
    return this._translations.get('details.transfer');
  }

  /**
   * Returns the value of translation message for key `parentTransfer`.
   * Default value: `Transfer that generated this one`
   */
  get parentTransfer(): string {
    return this._translations.get('parentTransfer');
  }

  /**
   * Returns the value of translation message for key `childTransfers`.
   * Default value: `Transfers generated by this one`
   */
  get childTransfers(): string {
    return this._translations.get('childTransfers');
  }
}

export class I18n$Transaction$Error {

  private _translations: Translations = new Translations('transaction.error');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `minTime`.
   * Default value: `A minimum period of time should be awaited to make a payment of this type.`
   */
  get minTime(): string {
    return this._translations.get('minTime');
  }

  /**
   * Returns the value of translation message for key `balance`.
   * Default value: `Insufficient balance to perform this operation`
   */
  get balance(): string {
    return this._translations.get('balance');
  }

  /**
   * Returns the value of translation message for key `upperLimit`.
   * Default value: `You cannot perform this payment because the upper balance limit of the destination account has been exceeded`
   */
  get upperLimit(): string {
    return this._translations.get('upperLimit');
  }

  /**
   * Returns the value of translation message for key `daily.amount`.
   * Default value: `The maximum daily amount of {amount} was exceeded`
   */
  dailyAmount(amount: string | number): string {
    return this._translations.get('daily.amount', {
      amount: amount
    });
  }

  /**
   * Returns the value of translation message for key `daily.count`.
   * Default value: `The maximum allowed number of payments per day is {count}`
   */
  dailyCount(count: string | number): string {
    return this._translations.get('daily.count', {
      count: count
    });
  }

  /**
   * Returns the value of translation message for key `weekly.amount`.
   * Default value: `The maximum weekly amount of {amount} was exceeded`
   */
  weeklyAmount(amount: string | number): string {
    return this._translations.get('weekly.amount', {
      amount: amount
    });
  }

  /**
   * Returns the value of translation message for key `weekly.count`.
   * Default value: `The maximum allowed number of payments per week is {count}`
   */
  weeklyCount(count: string | number): string {
    return this._translations.get('weekly.count', {
      count: count
    });
  }

  /**
   * Returns the value of translation message for key `monthly.amount`.
   * Default value: `The maximum monthly amount of {amount} was exceeded`
   */
  monthlyAmount(amount: string | number): string {
    return this._translations.get('monthly.amount', {
      amount: amount
    });
  }

  /**
   * Returns the value of translation message for key `monthly.count`.
   * Default value: `The maximum allowed number of payments per month is {count}`
   */
  monthlyCount(count: string | number): string {
    return this._translations.get('monthly.count', {
      count: count
    });
  }
}

export class I18n$Field {

  private _translations: Translations = new Translations('field');

  private _nested = {
    privacy: new I18n$Field$Privacy(),
    image: new I18n$Field$Image(),
    file: new I18n$Field$File(),
    user: new I18n$Field$User()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.privacy.initialize(values['privacy'] || {});
    this._nested.image.initialize(values['image'] || {});
    this._nested.file.initialize(values['file'] || {});
    this._nested.user.initialize(values['user'] || {});
  }

  /**
   * Returns the nested accessor for translation messages in `privacy`.
   */
  get privacy(): I18n$Field$Privacy {
    return this._nested.privacy;
  }

  /**
   * Returns the nested accessor for translation messages in `image`.
   */
  get image(): I18n$Field$Image {
    return this._nested.image;
  }

  /**
   * Returns the nested accessor for translation messages in `file`.
   */
  get file(): I18n$Field$File {
    return this._nested.file;
  }

  /**
   * Returns the nested accessor for translation messages in `user`.
   */
  get user(): I18n$Field$User {
    return this._nested.user;
  }
}

export class I18n$Field$Privacy {

  private _translations: Translations = new Translations('field.privacy');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `name`.
   * Default value: `Privacy`
   */
  get name(): string {
    return this._translations.get('name');
  }

  /**
   * Returns the value of translation message for key `private.tooltip`.
   * Default value: `This field is private. Click to allow other to view it.`
   */
  get privateTooltip(): string {
    return this._translations.get('private.tooltip');
  }

  /**
   * Returns the value of translation message for key `public.tooltip`.
   * Default value: `This field is visible by others. Click to make it private.`
   */
  get publicTooltip(): string {
    return this._translations.get('public.tooltip');
  }
}

export class I18n$Field$Image {

  private _translations: Translations = new Translations('field.image');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `noImage`.
   * Default value: `No image`
   */
  get noImage(): string {
    return this._translations.get('noImage');
  }

  /**
   * Returns the value of translation message for key `noImages`.
   * Default value: `No images`
   */
  get noImages(): string {
    return this._translations.get('noImages');
  }

  /**
   * Returns the value of translation message for key `upload`.
   * Default value: `Upload a new image`
   */
  get upload(): string {
    return this._translations.get('upload');
  }

  /**
   * Returns the value of translation message for key `manage`.
   * Default value: `Reorder or remove images`
   */
  get manage(): string {
    return this._translations.get('manage');
  }

  /**
   * Returns the value of translation message for key `remove`.
   * Default value: `Remove this image`
   */
  get remove(): string {
    return this._translations.get('remove');
  }

  /**
   * Returns the value of translation message for key `manageMessage`.
   * Default value: `You can drag / drop images to reorder them`
   */
  get manageMessage(): string {
    return this._translations.get('manageMessage');
  }

  /**
   * Returns the value of translation message for key `manageAfterConfirm`.
   * Default value: `After confirmation, please make sure to click the Save button in order for the changes to be applied.`
   */
  get manageAfterConfirm(): string {
    return this._translations.get('manageAfterConfirm');
  }
}

export class I18n$Field$File {

  private _translations: Translations = new Translations('field.file');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `noFile`.
   * Default value: `No file`
   */
  get noFile(): string {
    return this._translations.get('noFile');
  }

  /**
   * Returns the value of translation message for key `noFiles`.
   * Default value: `No files`
   */
  get noFiles(): string {
    return this._translations.get('noFiles');
  }

  /**
   * Returns the value of translation message for key `upload`.
   * Default value: `Upload a new file`
   */
  get upload(): string {
    return this._translations.get('upload');
  }

  /**
   * Returns the value of translation message for key `manage`.
   * Default value: `Reorder or remove files`
   */
  get manage(): string {
    return this._translations.get('manage');
  }

  /**
   * Returns the value of translation message for key `remove`.
   * Default value: `Remove this file`
   */
  get remove(): string {
    return this._translations.get('remove');
  }

  /**
   * Returns the value of translation message for key `manage.message`.
   * Default value: `You can drag / drop files to reorder them`
   */
  get manageMessage(): string {
    return this._translations.get('manage.message');
  }
}

export class I18n$Field$User {

  private _translations: Translations = new Translations('field.user');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `placeholder.allowSearch`.
   * Default value: `Type to search`
   */
  get placeholderAllowSearch(): string {
    return this._translations.get('placeholder.allowSearch');
  }

  /**
   * Returns the value of translation message for key `placeholder.principal`.
   * Default value: `Type the user identifier`
   */
  get placeholderPrincipal(): string {
    return this._translations.get('placeholder.principal');
  }

  /**
   * Returns the value of translation message for key `contact.tooltip`.
   * Default value: `Pick from your contact list`
   */
  get contactTooltip(): string {
    return this._translations.get('contact.tooltip');
  }

  /**
   * Returns the value of translation message for key `contact.title`.
   * Default value: `Select a contact`
   */
  get contactTitle(): string {
    return this._translations.get('contact.title');
  }

  /**
   * Returns the value of translation message for key `contact.empty`.
   * Default value: `Your contact list is empty`
   */
  get contactEmpty(): string {
    return this._translations.get('contact.empty');
  }
}

export class I18n$User {

  private _translations: Translations = new Translations('user');

  private _nested = {
    title: new I18n$User$Title(),
    profile: new I18n$User$Profile(),
    registration: new I18n$User$Registration(),
    orderBy: new I18n$User$OrderBy()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.title.initialize(values['title'] || {});
    this._nested.profile.initialize(values['profile'] || {});
    this._nested.registration.initialize(values['registration'] || {});
    this._nested.orderBy.initialize(values['orderBy'] || {});
  }

  /**
   * Returns the value of translation message for key `group`.
   * Default value: `Group`
   */
  get group(): string {
    return this._translations.get('group');
  }

  /**
   * Returns the value of translation message for key `groupSet`.
   * Default value: `Group set`
   */
  get groupSet(): string {
    return this._translations.get('groupSet');
  }

  /**
   * Returns the value of translation message for key `group.filter`.
   * Default value: `Groups`
   */
  get groupFilter(): string {
    return this._translations.get('group.filter');
  }

  /**
   * Returns the value of translation message for key `name`.
   * Default value: `Full name`
   */
  get name(): string {
    return this._translations.get('name');
  }

  /**
   * Returns the value of translation message for key `username`.
   * Default value: `Login name`
   */
  get username(): string {
    return this._translations.get('username');
  }

  /**
   * Returns the value of translation message for key `email`.
   * Default value: `E-mail`
   */
  get email(): string {
    return this._translations.get('email');
  }

  /**
   * Returns the value of translation message for key `email.pending`.
   * Default value: `E-mail pending validation`
   */
  get emailPending(): string {
    return this._translations.get('email.pending');
  }

  /**
   * Returns the value of translation message for key `noImage`.
   * Default value: `No profile image`
   */
  get noImage(): string {
    return this._translations.get('noImage');
  }

  /**
   * Returns the value of translation message for key `noImages`.
   * Default value: `No profile images`
   */
  get noImages(): string {
    return this._translations.get('noImages');
  }

  /**
   * Returns the value of translation message for key `address.define`.
   * Default value: `Define address`
   */
  get addressDefine(): string {
    return this._translations.get('address.define');
  }

  /**
   * Returns the value of translation message for key `address.add`.
   * Default value: `Add address`
   */
  get addressAdd(): string {
    return this._translations.get('address.add');
  }

  /**
   * Returns the value of translation message for key `address.remove`.
   * Default value: `Remove this address`
   */
  get addressRemove(): string {
    return this._translations.get('address.remove');
  }

  /**
   * Returns the value of translation message for key `address.none`.
   * Default value: `There are currently no addresses`
   */
  get addressNone(): string {
    return this._translations.get('address.none');
  }

  /**
   * Returns the value of translation message for key `phone.add`.
   * Default value: `Add phone`
   */
  get phoneAdd(): string {
    return this._translations.get('phone.add');
  }

  /**
   * Returns the value of translation message for key `phone.add.mobile`.
   * Default value: `Add mobile phone`
   */
  get phoneAddMobile(): string {
    return this._translations.get('phone.add.mobile');
  }

  /**
   * Returns the value of translation message for key `phone.add.landLine`.
   * Default value: `Add land-line phone`
   */
  get phoneAddLandLine(): string {
    return this._translations.get('phone.add.landLine');
  }

  /**
   * Returns the value of translation message for key `phone.remove`.
   * Default value: `Remove this phone`
   */
  get phoneRemove(): string {
    return this._translations.get('phone.remove');
  }

  /**
   * Returns the value of translation message for key `phone.none`.
   * Default value: `There are currently no phones`
   */
  get phoneNone(): string {
    return this._translations.get('phone.none');
  }

  /**
   * Returns the value of translation message for key `contactInfo`.
   * Default value: `Additional contact information`
   */
  get contactInfo(): string {
    return this._translations.get('contactInfo');
  }

  /**
   * Returns the value of translation message for key `contactInfo.add`.
   * Default value: `Add contact`
   */
  get contactInfoAdd(): string {
    return this._translations.get('contactInfo.add');
  }

  /**
   * Returns the value of translation message for key `contactInfo.remove`.
   * Default value: `Remove contact`
   */
  get contactInfoRemove(): string {
    return this._translations.get('contactInfo.remove');
  }

  /**
   * Returns the value of translation message for key `contactInfo.none`.
   * Default value: `There are currently no additional contacts`
   */
  get contactInfoNone(): string {
    return this._translations.get('contactInfo.none');
  }

  /**
   * Returns the value of translation message for key `confirmation.message`.
   * Default value: `To save your profile, provide your {type}`
   */
  confirmationMessage(type: string | number): string {
    return this._translations.get('confirmation.message', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `profileSaved`.
   * Default value: `The profile was saved`
   */
  get profileSaved(): string {
    return this._translations.get('profileSaved');
  }

  /**
   * Returns the value of translation message for key `imagesChanged`.
   * Default value: `To actually save the changes on images, the profile needs to be saved`
   */
  get imagesChanged(): string {
    return this._translations.get('imagesChanged');
  }

  /**
   * Returns the value of translation message for key `newEmailConfirmed`.
   * Default value: `Your new e-mail address was successfully confirmed`
   */
  get newEmailConfirmed(): string {
    return this._translations.get('newEmailConfirmed');
  }

  /**
   * Returns the value of translation message for key `passwordConfirmation`.
   * Default value: `{type} confirmation`
   */
  passwordConfirmation(type: string | number): string {
    return this._translations.get('passwordConfirmation', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `securityQuestion.message`.
   * Default value: `If you happen to forget your password, you will need to correctly answer the security question in order to reset the password.<br>This can be set later, but keep in mind that the password recovery won't work without it.`
   */
  get securityQuestionMessage(): string {
    return this._translations.get('securityQuestion.message');
  }

  /**
   * Returns the value of translation message for key `securityQuestion.empty`.
   * Default value: `Leave blank`
   */
  get securityQuestionEmpty(): string {
    return this._translations.get('securityQuestion.empty');
  }

  /**
   * Returns the value of translation message for key `captcha`.
   * Default value: `Visual validation`
   */
  get captcha(): string {
    return this._translations.get('captcha');
  }

  /**
   * Returns the value of translation message for key `contact`.
   * Default value: `Contact`
   */
  get contact(): string {
    return this._translations.get('contact');
  }

  /**
   * Returns the nested accessor for translation messages in `title`.
   */
  get title(): I18n$User$Title {
    return this._nested.title;
  }

  /**
   * Returns the nested accessor for translation messages in `profile`.
   */
  get profile(): I18n$User$Profile {
    return this._nested.profile;
  }

  /**
   * Returns the nested accessor for translation messages in `registration`.
   */
  get registration(): I18n$User$Registration {
    return this._nested.registration;
  }

  /**
   * Returns the nested accessor for translation messages in `orderBy`.
   */
  get orderBy(): I18n$User$OrderBy {
    return this._nested.orderBy;
  }
}

export class I18n$User$Title {

  private _translations: Translations = new Translations('user.title');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `myProfile`.
   * Default value: `My profile`
   */
  get myProfile(): string {
    return this._translations.get('myProfile');
  }

  /**
   * Returns the value of translation message for key `editProfile`.
   * Default value: `Edit profile`
   */
  get editProfile(): string {
    return this._translations.get('editProfile');
  }

  /**
   * Returns the value of translation message for key `image`.
   * Default value: `Profile image`
   */
  get image(): string {
    return this._translations.get('image');
  }

  /**
   * Returns the value of translation message for key `images`.
   * Default value: `Profile images`
   */
  get images(): string {
    return this._translations.get('images');
  }

  /**
   * Returns the value of translation message for key `fields`.
   * Default value: `Profile fields`
   */
  get fields(): string {
    return this._translations.get('fields');
  }

  /**
   * Returns the value of translation message for key `group`.
   * Default value: `Choose the group you want to participate`
   */
  get group(): string {
    return this._translations.get('group');
  }

  /**
   * Returns the value of translation message for key `phones`.
   * Default value: `Phones`
   */
  get phones(): string {
    return this._translations.get('phones');
  }

  /**
   * Returns the value of translation message for key `addresses`.
   * Default value: `Addresses`
   */
  get addresses(): string {
    return this._translations.get('addresses');
  }

  /**
   * Returns the value of translation message for key `contactInfos`.
   * Default value: `Additional contacts`
   */
  get contactInfos(): string {
    return this._translations.get('contactInfos');
  }

  /**
   * Returns the value of translation message for key `confirmation`.
   * Default value: `Confirmation`
   */
  get confirmation(): string {
    return this._translations.get('confirmation');
  }

  /**
   * Returns the value of translation message for key `registration`.
   * Default value: `User registration`
   */
  get registration(): string {
    return this._translations.get('registration');
  }

  /**
   * Returns the value of translation message for key `registration.confirmation`.
   * Default value: `Registration confirmation`
   */
  get registrationConfirmation(): string {
    return this._translations.get('registration.confirmation');
  }

  /**
   * Returns the value of translation message for key `registration.done`.
   * Default value: `Registration successful`
   */
  get registrationDone(): string {
    return this._translations.get('registration.done');
  }

  /**
   * Returns the value of translation message for key `contactList`.
   * Default value: `Contact list`
   */
  get contactList(): string {
    return this._translations.get('contactList');
  }

  /**
   * Returns the value of translation message for key `addContact`.
   * Default value: `Add a new contact`
   */
  get addContact(): string {
    return this._translations.get('addContact');
  }

  /**
   * Returns the value of translation message for key `search`.
   * Default value: `Business directory`
   */
  get search(): string {
    return this._translations.get('search');
  }
}

export class I18n$User$Profile {

  private _translations: Translations = new Translations('user.profile');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `noPermission`.
   * Default value: `You don't have permission to view the profile of this user`
   */
  get noPermission(): string {
    return this._translations.get('noPermission');
  }

  /**
   * Returns the value of translation message for key `addContact`.
   * Default value: `Add to my contacts`
   */
  get addContact(): string {
    return this._translations.get('addContact');
  }

  /**
   * Returns the value of translation message for key `addContact.done`.
   * Default value: `{user} was added to your contact list`
   */
  addContactDone(user: string | number): string {
    return this._translations.get('addContact.done', {
      user: user
    });
  }

  /**
   * Returns the value of translation message for key `removeContact`.
   * Default value: `Remove from my contacts`
   */
  get removeContact(): string {
    return this._translations.get('removeContact');
  }

  /**
   * Returns the value of translation message for key `removeContact.done`.
   * Default value: `{user} was removed from your contact list`
   */
  removeContactDone(user: string | number): string {
    return this._translations.get('removeContact.done', {
      user: user
    });
  }

  /**
   * Returns the value of translation message for key `pay`.
   * Default value: `Make payment`
   */
  get pay(): string {
    return this._translations.get('pay');
  }

  /**
   * Returns the value of translation message for key `viewAds`.
   * Default value: `View advertisements`
   */
  get viewAds(): string {
    return this._translations.get('viewAds');
  }
}

export class I18n$User$Registration {

  private _translations: Translations = new Translations('user.registration');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `active`.
   * Default value: `You have been successfully registered, and your account is now active.`
   */
  get active(): string {
    return this._translations.get('active');
  }

  /**
   * Returns the value of translation message for key `inactive`.
   * Default value: `Your account was successfully created.<br>However, you will need to be activated by the administration.<br>You will be notified when your account is active.`
   */
  get inactive(): string {
    return this._translations.get('inactive');
  }

  /**
   * Returns the value of translation message for key `pending`.
   * Default value: `Your registration has been submitted, and needs to be verified.<br>You should receive an e-mail shortly with instructions on how to activate your account.<br>If you don't receive the e-mail, make sure to check your spam / junk folder.`
   */
  get pending(): string {
    return this._translations.get('pending');
  }

  /**
   * Returns the value of translation message for key `principal.single`.
   * Default value: `You can use your {principal} ({value}) on {channels}`
   */
  principalSingle($: {principal: string | number, value: string | number, channels: string | number}): string {
    return this._translations.get('principal.single', {
      principal: $.principal,
      value: $.value,
      channels: $.channels
    });
  }

  /**
   * Returns the value of translation message for key `principal.multiple.preface`.
   * Default value: `You can login with the following data:`
   */
  get principalMultiplePreface(): string {
    return this._translations.get('principal.multiple.preface');
  }

  /**
   * Returns the value of translation message for key `principal.multiple.item`.
   * Default value: `<b>{principal}</b> ({value}): can be used on {channels}`
   */
  principalMultipleItem($: {principal: string | number, value: string | number, channels: string | number}): string {
    return this._translations.get('principal.multiple.item', {
      principal: $.principal,
      value: $.value,
      channels: $.channels
    });
  }

  /**
   * Returns the value of translation message for key `generatedPasswords.none`.
   * Default value: `You can now login with the password you have informed.`
   */
  get generatedPasswordsNone(): string {
    return this._translations.get('generatedPasswords.none');
  }

  /**
   * Returns the value of translation message for key `generatedPasswords.single`.
   * Default value: `You will receive an e-mail shortly with your generated {type}.`
   */
  generatedPasswordsSingle(type: string | number): string {
    return this._translations.get('generatedPasswords.single', {
      type: type
    });
  }

  /**
   * Returns the value of translation message for key `generatedPasswords.multiple`.
   * Default value: `You will receive an e-mail shortly with the following generated passwords: {types}.`
   */
  generatedPasswordsMultiple(types: string | number): string {
    return this._translations.get('generatedPasswords.multiple', {
      types: types
    });
  }
}

export class I18n$User$OrderBy {

  private _translations: Translations = new Translations('user.orderBy');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `alphabeticallyAsc`.
   * Default value: `Name (A-Z)`
   */
  get alphabeticallyAsc(): string {
    return this._translations.get('alphabeticallyAsc');
  }

  /**
   * Returns the value of translation message for key `alphabeticallyDesc`.
   * Default value: `Name (Z-A)`
   */
  get alphabeticallyDesc(): string {
    return this._translations.get('alphabeticallyDesc');
  }
}

export class I18n$Phone {

  private _translations: Translations = new Translations('phone');

  private _nested = {
    verify: new I18n$Phone$Verify()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.verify.initialize(values['verify'] || {});
  }

  /**
   * Returns the value of translation message for key `mobile`.
   * Default value: `Mobile phone`
   */
  get mobile(): string {
    return this._translations.get('mobile');
  }

  /**
   * Returns the value of translation message for key `landLine`.
   * Default value: `Land-line phone`
   */
  get landLine(): string {
    return this._translations.get('landLine');
  }

  /**
   * Returns the value of translation message for key `name.mobile`.
   * Default value: `Mobile phone name`
   */
  get nameMobile(): string {
    return this._translations.get('name.mobile');
  }

  /**
   * Returns the value of translation message for key `name.landLine`.
   * Default value: `Land-line phone name`
   */
  get nameLandLine(): string {
    return this._translations.get('name.landLine');
  }

  /**
   * Returns the value of translation message for key `number`.
   * Default value: `Number`
   */
  get number(): string {
    return this._translations.get('number');
  }

  /**
   * Returns the value of translation message for key `number.mobile`.
   * Default value: `Mobile phone number`
   */
  get numberMobile(): string {
    return this._translations.get('number.mobile');
  }

  /**
   * Returns the value of translation message for key `number.landLine`.
   * Default value: `Land-line phone number`
   */
  get numberLandLine(): string {
    return this._translations.get('number.landLine');
  }

  /**
   * Returns the value of translation message for key `phoneNumber`.
   * Default value: `Phone number`
   */
  get phoneNumber(): string {
    return this._translations.get('phoneNumber');
  }

  /**
   * Returns the value of translation message for key `extension`.
   * Default value: `Land-line extension`
   */
  get extension(): string {
    return this._translations.get('extension');
  }

  /**
   * Returns the value of translation message for key `extensionValue`.
   * Default value: `ext. {value}`
   */
  extensionValue(value: string | number): string {
    return this._translations.get('extensionValue', {
      value: value
    });
  }

  /**
   * Returns the value of translation message for key `numberExtensionValue`.
   * Default value: `{number} ext. {extension}`
   */
  numberExtensionValue($: {number: string | number, extension: string | number}): string {
    return this._translations.get('numberExtensionValue', {
      number: $.number,
      extension: $.extension
    });
  }

  /**
   * Returns the value of translation message for key `enabledSms`.
   * Default value: `Enabled for SMS`
   */
  get enabledSms(): string {
    return this._translations.get('enabledSms');
  }

  /**
   * Returns the nested accessor for translation messages in `verify`.
   */
  get verify(): I18n$Phone$Verify {
    return this._nested.verify;
  }
}

export class I18n$Phone$Verify {

  private _translations: Translations = new Translations('phone.verify');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `title`.
   * Default value: `Verify {number} for SMS`
   */
  title(number: string | number): string {
    return this._translations.get('title', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `code`.
   * Default value: `Code`
   */
  get code(): string {
    return this._translations.get('code');
  }

  /**
   * Returns the value of translation message for key `send`.
   * Default value: `Send`
   */
  get send(): string {
    return this._translations.get('send');
  }

  /**
   * Returns the value of translation message for key `message`.
   * Default value: `Click the button above to send the verification code to your phone`
   */
  get message(): string {
    return this._translations.get('message');
  }

  /**
   * Returns the value of translation message for key `done`.
   * Default value: `The verification code was sent to {number}`
   */
  done(number: string | number): string {
    return this._translations.get('done', {
      number: number
    });
  }

  /**
   * Returns the value of translation message for key `error.expired`.
   * Default value: `The verification code was not sent or has expired.<br> Please, send the code again to your phone and restart the process.`
   */
  get errorExpired(): string {
    return this._translations.get('error.expired');
  }

  /**
   * Returns the value of translation message for key `error.invalid`.
   * Default value: `Invalid verification code`
   */
  get errorInvalid(): string {
    return this._translations.get('error.invalid');
  }

  /**
   * Returns the value of translation message for key `error.maxAttempts`.
   * Default value: `You have exceeded the number of allowed attempts.<br>Please, send the code again to your phone and restart the process.`
   */
  get errorMaxAttempts(): string {
    return this._translations.get('error.maxAttempts');
  }
}

export class I18n$Address {

  private _translations: Translations = new Translations('address');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `address`.
   * Default value: `Address`
   */
  get address(): string {
    return this._translations.get('address');
  }

  /**
   * Returns the value of translation message for key `line1`.
   * Default value: `Address line 1`
   */
  get line1(): string {
    return this._translations.get('line1');
  }

  /**
   * Returns the value of translation message for key `line2`.
   * Default value: `Address line 2`
   */
  get line2(): string {
    return this._translations.get('line2');
  }

  /**
   * Returns the value of translation message for key `buildingNumber`.
   * Default value: `Building number`
   */
  get buildingNumber(): string {
    return this._translations.get('buildingNumber');
  }

  /**
   * Returns the value of translation message for key `city`.
   * Default value: `City`
   */
  get city(): string {
    return this._translations.get('city');
  }

  /**
   * Returns the value of translation message for key `complement`.
   * Default value: `Complement`
   */
  get complement(): string {
    return this._translations.get('complement');
  }

  /**
   * Returns the value of translation message for key `country`.
   * Default value: `Country`
   */
  get country(): string {
    return this._translations.get('country');
  }

  /**
   * Returns the value of translation message for key `neighborhood`.
   * Default value: `Neighborhood`
   */
  get neighborhood(): string {
    return this._translations.get('neighborhood');
  }

  /**
   * Returns the value of translation message for key `poBox`.
   * Default value: `Post-office box`
   */
  get poBox(): string {
    return this._translations.get('poBox');
  }

  /**
   * Returns the value of translation message for key `region`.
   * Default value: `Region / state`
   */
  get region(): string {
    return this._translations.get('region');
  }

  /**
   * Returns the value of translation message for key `street`.
   * Default value: `Street`
   */
  get street(): string {
    return this._translations.get('street');
  }

  /**
   * Returns the value of translation message for key `zip`.
   * Default value: `Zip code`
   */
  get zip(): string {
    return this._translations.get('zip');
  }
}

export class I18n$Ad {

  private _translations: Translations = new Translations('ad');

  private _nested = {
    orderBy: new I18n$Ad$OrderBy(),
    title: new I18n$Ad$Title()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.orderBy.initialize(values['orderBy'] || {});
    this._nested.title.initialize(values['title'] || {});
  }

  /**
   * Returns the value of translation message for key `name`.
   * Default value: `Title`
   */
  get name(): string {
    return this._translations.get('name');
  }

  /**
   * Returns the value of translation message for key `owner`.
   * Default value: `Publisher`
   */
  get owner(): string {
    return this._translations.get('owner');
  }

  /**
   * Returns the value of translation message for key `price`.
   * Default value: `Price`
   */
  get price(): string {
    return this._translations.get('price');
  }

  /**
   * Returns the value of translation message for key `category`.
   * Default value: `Category`
   */
  get category(): string {
    return this._translations.get('category');
  }

  /**
   * Returns the value of translation message for key `categories`.
   * Default value: `Categories`
   */
  get categories(): string {
    return this._translations.get('categories');
  }

  /**
   * Returns the value of translation message for key `byOwner`.
   * Default value: `By {owner}`
   */
  byOwner(owner: string | number): string {
    return this._translations.get('byOwner', {
      owner: owner
    });
  }

  /**
   * Returns the value of translation message for key `showAllCategories`.
   * Default value: `Show all`
   */
  get showAllCategories(): string {
    return this._translations.get('showAllCategories');
  }

  /**
   * Returns the value of translation message for key `rootCategory`.
   * Default value: `Main`
   */
  get rootCategory(): string {
    return this._translations.get('rootCategory');
  }

  /**
   * Returns the nested accessor for translation messages in `orderBy`.
   */
  get orderBy(): I18n$Ad$OrderBy {
    return this._nested.orderBy;
  }

  /**
   * Returns the nested accessor for translation messages in `title`.
   */
  get title(): I18n$Ad$Title {
    return this._nested.title;
  }
}

export class I18n$Ad$OrderBy {

  private _translations: Translations = new Translations('ad.orderBy');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `date`.
   * Default value: `Last published`
   */
  get date(): string {
    return this._translations.get('date');
  }

  /**
   * Returns the value of translation message for key `priceAsc`.
   * Default value: `Lowest price`
   */
  get priceAsc(): string {
    return this._translations.get('priceAsc');
  }

  /**
   * Returns the value of translation message for key `priceDesc`.
   * Default value: `Highest price`
   */
  get priceDesc(): string {
    return this._translations.get('priceDesc');
  }
}

export class I18n$Ad$Title {

  private _translations: Translations = new Translations('ad.title');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `search`.
   * Default value: `Advertisements`
   */
  get search(): string {
    return this._translations.get('search');
  }

  /**
   * Returns the value of translation message for key `owner`.
   * Default value: `Advertisements of {name}`
   */
  owner(name: string | number): string {
    return this._translations.get('owner', {
      name: name
    });
  }
}

export class I18n$Notification {

  private _translations: Translations = new Translations('notification');

  private _nested = {
    actions: new I18n$Notification$Actions()
  };

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
    this._nested.actions.initialize(values['actions'] || {});
  }

  /**
   * Returns the value of translation message for key `message`.
   * Default value: `Message`
   */
  get message(): string {
    return this._translations.get('message');
  }

  /**
   * Returns the value of translation message for key `title`.
   * Default value: `Notifications`
   */
  get title(): string {
    return this._translations.get('title');
  }

  /**
   * Returns the value of translation message for key `onlyUnread`.
   * Default value: `Unread only`
   */
  get onlyUnread(): string {
    return this._translations.get('onlyUnread');
  }

  /**
   * Returns the nested accessor for translation messages in `actions`.
   */
  get actions(): I18n$Notification$Actions {
    return this._nested.actions;
  }
}

export class I18n$Notification$Actions {

  private _translations: Translations = new Translations('notification.actions');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `remove`.
   * Default value: `Remove this notification`
   */
  get remove(): string {
    return this._translations.get('remove');
  }

  /**
   * Returns the value of translation message for key `removeAll`.
   * Default value: `Remove all`
   */
  get removeAll(): string {
    return this._translations.get('removeAll');
  }

  /**
   * Returns the value of translation message for key `markAllRead`.
   * Default value: `Mark all as read`
   */
  get markAllRead(): string {
    return this._translations.get('markAllRead');
  }
}

export class I18n$Operation {

  private _translations: Translations = new Translations('operation');

  /**
   * Initializes the translation values.
   * @param values The translations values.
   */
  initialize(values: Object) {
    this._translations.initialize((values || {}) as TranslationValues);
  }

  /**
   * Returns the value of translation message for key `user`.
   * Default value: `User`
   */
  get user(): string {
    return this._translations.get('user');
  }

  /**
   * Returns the value of translation message for key `ad`.
   * Default value: `Advertisement`
   */
  get ad(): string {
    return this._translations.get('ad');
  }

  /**
   * Returns the value of translation message for key `transfer`.
   * Default value: `Transfer`
   */
  get transfer(): string {
    return this._translations.get('transfer');
  }

  /**
   * Returns the value of translation message for key `fileUpload`.
   * Default value: `File upload`
   */
  get fileUpload(): string {
    return this._translations.get('fileUpload');
  }

  /**
   * Returns the value of translation message for key `redirecting`.
   * Default value: `You are being redirected...`
   */
  get redirecting(): string {
    return this._translations.get('redirecting');
  }
}

