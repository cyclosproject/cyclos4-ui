import {
  AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, Injector, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren,
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { AddressNew, CustomFieldDetailed, GroupForRegistration, Image, StoredFile, UserDataForNew, UserNew } from 'app/api/models';
import { RegistrationAgreementsComponent } from 'app/login/registration-agreements.component';
import { BaseComponent } from 'app/shared/base.component';
import { blank, empty, focus } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Public registration step: confirmation
 */
@Component({
  selector: 'registration-step-confirm',
  templateUrl: 'registration-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepConfirmComponent
  extends BaseComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

  empty = empty;

  focusSecurityAnswer = false;

  @Input() data: UserDataForNew;
  @Input() form: FormGroup;
  @Input() user: UserNew;
  @Input() image: Image;
  @Input() customImages: Image[];
  @Input() customFiles: StoredFile[];

  @ViewChildren('securityAnswer') securityAnswer: QueryList<InputFieldComponent>;
  @ViewChild('agreementsContent') agreementsContent: ElementRef;

  constructor(
    injector: Injector,
    private modal: BsModalService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (!empty(this.data.securityQuestions)) {
      this.addSub(this.form.get('securityQuestion').valueChanges.subscribe(question => {
        this.focusSecurityAnswer = !blank(question);
      }));
    }
  }

  ngAfterViewInit() {
    if (this.agreementsContent && this.agreementsContent.nativeElement) {
      const el: HTMLElement = this.agreementsContent.nativeElement;
      el.innerHTML = this.i18n.pendingAgreements.agree(
        `<a href="#" onclick="event.preventDefault();event.stopPropagation();showAgreements()">
        ${this.data.agreements.map(a => a.name).join(', ')}
        </a>`,
      );
      window['showAgreements'] = () => {
        this.modal.show(RegistrationAgreementsComponent, {
          class: 'modal-form',
          initialState: {
            agreements: this.data.agreements,
          },
        });
      };
    }
  }

  ngAfterViewChecked() {
    if (this.focusSecurityAnswer) {
      this.securityAnswer.forEach(f => focus(f));
      this.focusSecurityAnswer = false;
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (window['showAgreements']) {
      delete window['showAgreements'];
    }
  }

  passwordForm(index: number): FormGroup {
    const array = this.form.get('passwords') as FormArray;
    return array.controls[index] as FormGroup;
  }

  get group(): GroupForRegistration {
    const groups = this.dataForUiHolder.dataForUi.publicRegistrationGroups || [];
    if (groups.length === 1) {
      return null;
    }
    return groups.find(g => g.id === this.user.group);
  }

  get name(): string {
    return (this.user.name || '').trim();
  }

  get username(): string {
    return (this.user.username || '').trim();
  }

  get email(): string {
    return (this.user.email || '').trim();
  }

  get mobile(): string {
    const phones = this.user.mobilePhones || [];
    return empty(phones) ? null : (phones[0].number || '').trim();
  }

  get landLine(): string {
    const phones = this.user.landLinePhones || [];
    const phoneNumber = empty(phones) ? null : (phones[0].number || '').trim();
    if (empty(phoneNumber)) {
      return '';
    }
    const extension = empty(phones) ? null : (phones[0].extension || '').trim();
    if (extension === '') {
      return phoneNumber;
    } else {
      return this.i18n.phone.numberExtensionValue({
        number: phoneNumber,
        extension,
      });
    }
  }

  get address(): AddressNew {
    const addresses = this.user.addresses || [];
    if (empty(addresses)) {
      return null;
    }
    return addresses[0] as AddressNew;
  }

  get customFields(): CustomFieldDetailed[] {
    return this.data.customFields.filter(cf => !blank(this.user.customValues[cf.internalName]));
  }

  get autocompletePasswords(): string {
    const auth = this.login.auth || {};
    const role = auth.role;
    // Will autocomplete passwords only in public registration
    return role ? 'off' : 'on';
  }
}
