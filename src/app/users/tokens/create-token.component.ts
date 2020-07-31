import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { OperatorResult, TokenType, User } from 'app/api/models';
import { OperatorsService, TokensService } from 'app/api/services';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash-es';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * Used in a popup to create a token
 */
@Component({
  selector: 'create-token',
  templateUrl: 'create-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTokenComponent extends BaseComponent implements OnInit {

  @Input() type: TokenType;
  @Input() user: User;
  @Input() required: boolean;
  @Input() updateAction: () => void;

  form: FormGroup;
  operators$ = new BehaviorSubject<OperatorResult[]>(null);
  canActivate$ = new BehaviorSubject<boolean>(null);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private tokensService: TokensService,
    private operatorsService: OperatorsService) {
    super(injector);
  }

  ngOnInit() {
    this.canActivate$.next(!!this.user);
    this.form = this.formBuilder.group({
      user: this.user ? this.user.id : null,
      operator: null,
      value: [null, Validators.required],
      activateNow: false,
    });
    if (!this.user) {
      this.form.get('user').valueChanges.subscribe(() => this.fillOperatorsField());
    }
  }

  fillOperatorsField() {
    const id = this.form.get('user').value;
    if (id) {
      this.canActivate$.next(true);
      this.operatorsService.searchUserOperators$Response({ user: id, skipTotalCount: true, pageSize: 9999999 })
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

  submit() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
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
