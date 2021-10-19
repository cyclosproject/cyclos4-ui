import { ChangeDetectorRef, Directive, Injector, OnInit } from '@angular/core';
import { VoucherInfoService } from 'app/api/services/voucher-info.service';
import { LayoutService } from 'app/core/layout.service';
import { StateManager } from 'app/core/state-manager';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { VoucherState } from 'app/voucher/voucher-state';

/**
 * Base class for all voucher components.
 * Subclasses overwriting the ngOnInit() method MUST invoke super.ngOnInit()
 */
@Directive()
export abstract class VoucherBaseComponent implements OnInit {
  i18n: I18n;
  state: VoucherState;
  layout: LayoutService;
  protected voucherService: VoucherInfoService;
  protected changeDetector: ChangeDetectorRef;
  protected stateManager: StateManager;

  constructor(
    injector: Injector) {
    this.i18n = injector.get(I18nInjectionToken);
    this.state = injector.get(VoucherState);
    this.layout = injector.get(LayoutService);
    this.voucherService = injector.get(VoucherInfoService);
    this.changeDetector = injector.get(ChangeDetectorRef);
    this.stateManager = injector.get(StateManager);
  }

  //protected abstract resolveTitle(): string;

  get title() {
    return this.state.title;
  }

  set title(title: string) {
    this.state.title = title;
  }

  ngOnInit() {
  }
}