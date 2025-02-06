import { ChangeDetectionStrategy, Component, ElementRef, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import {
  OperatorResult,
  PhysicalTokenTypeEnum,
  TokenDataForNew,
  TokenType,
  User,
  UserStatusEnum
} from 'app/api/models';
import { OperatorsService } from 'app/api/services/operators.service';
import { TokensService } from 'app/api/services/tokens.service';
import { BaseComponent } from 'app/shared/base.component';
import { focus, validateBeforeSubmit } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { cloneDeep } from 'lodash-es';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Used in a popup to create a token
 */
@Component({
  selector: 'create-token',
  templateUrl: 'create-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTokenComponent extends BaseComponent implements OnInit {
  physicalType = PhysicalTokenTypeEnum;

  @Input() type: TokenType;
  @Input() user: User;
  @Input() required: boolean;
  @Input() updateAction: () => void;

  @ViewChild('inputField') inputField: ElementRef<InputFieldComponent>;

  form: FormGroup;
  operators$ = new BehaviorSubject<OperatorResult[]>(null);
  canActivate$ = new BehaviorSubject<boolean>(null);
  data$ = new BehaviorSubject<TokenDataForNew>(null);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private tokensService: TokensService,
    private operatorsService: OperatorsService,
    private modal: BsModalService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.addSub(
      this.tokensService.getTokenDataForNew({ type: this.type.id, user: this.user?.id }).subscribe(data => {
        this.data$.next(data);
        this.canActivate$.next(!!this.user && data.canActivate);
        this.form = this.formBuilder.group({
          user: this.user ? this.user.id : null,
          operator: null,
          value: [null, Validators.required],
          activateNow: data.token.activateNow
        });
        if (!this.user) {
          this.form.get('user').valueChanges.subscribe(() => this.fillOperatorsField());
        }
      })
    );
  }

  fillOperatorsField() {
    const id = this.form.get('user').value;
    if (id) {
      this.canActivate$.next(this.data$.value.canActivate);
      this.operatorsService
        .searchUserOperators$Response({
          user: id,
          skipTotalCount: true,
          pageSize: 9999999,
          statuses: [UserStatusEnum.ACTIVE, UserStatusEnum.BLOCKED, UserStatusEnum.DISABLED]
        })
        .subscribe(response => {
          if (response.ok && response.body?.length > 0) {
            this.operators$.next(response.body);
          } else {
            this.operators$.next(null);
          }
        });
    } else {
      this.canActivate$.next(false);
      this.operators$.next(null);
    }
  }

  showScanQrCode() {
    const ref = this.modal.show(ScanQrCodeComponent, { class: 'modal-form' });
    const component = ref.content as ScanQrCodeComponent;
    component.select.pipe(first()).subscribe(value => this.form.controls['value'].setValue(value));
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }

  submit() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = cloneDeep(this.form.value);
    if (value.operator) {
      value.user = value.operator;
      delete value.operator;
    }
    this.tokensService.createToken({ type: this.type.id, body: value }).subscribe(() => {
      this.notification.snackBar(this.i18n.token.action.done.created);
      this.updateAction();
    });
    this.modalRef.hide();
  }
}
