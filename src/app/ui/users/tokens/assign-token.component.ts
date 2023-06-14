import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { OperatorResult, User } from 'app/api/models';
import { OperatorsService } from 'app/api/services/operators.service';
import { TokensService } from 'app/api/services/tokens.service';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash-es';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * Used in a popup to assign a token
 */
@Component({
  selector: 'assign-token',
  templateUrl: 'assign-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignTokenComponent extends BaseComponent implements OnInit {

  @Input() token: string;
  @Input() updateAction: () => void;

  form: FormGroup;
  operators$ = new BehaviorSubject<OperatorResult[]>(null);

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private tokensService: TokensService,
    private operatorsService: OperatorsService) {
    super(injector);
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      user: [null, Validators.required],
      operator: null,
    });
    this.form.get('user').valueChanges.subscribe(user => this.fillOperatorsField(user));
  }

  fillOperatorsField(user: User) {
    this.operatorsService.searchUserOperators$Response({ user: user.id, skipTotalCount: true, pageSize: 999999 })
      .subscribe(response => {
        if (response.ok) {
          this.operators$.next(response.body);
        } else {
          this.operators$.next(null);
        }
      });
  }

  submit() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const values = cloneDeep(this.form.value);
    this.tokensService.assignToken({ id: this.token, user: values.operator ? values.operator : values.user }).subscribe(() => {
      this.notification.snackBar(this.i18n.token.action.done.assigned);
      this.updateAction();
    });
    this.modalRef.hide();
  }
}
