import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AvailabilityEnum, PasswordTypeDetailed } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { isNumeric } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

const UpperCaseLetters = /[A-Z]/;
const LowerCaseLetters = /[a-z]/;
const Numbers = /[0-9]/;
const SpecialCharacters = /[\`\@\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\[\\\]\^\_\{\}\~]/;

/**
 * Renders hints on a password value according to the password policy
 */
@Component({
  selector: 'password-hints',
  templateUrl: 'password-hints.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordHintsComponent extends BaseComponent implements OnInit {

  @Input() passwordType: PasswordTypeDetailed;
  @Input() control: FormControl;

  fixedLength: number;
  minLength: number;
  lowerCaseLetters: boolean;
  upperCaseLetters: boolean;
  numbers: boolean;
  specialCharacters: boolean;

  fixedLength$ = new BehaviorSubject(false);
  minLength$ = new BehaviorSubject(false);
  lowerCaseLetters$ = new BehaviorSubject(false);
  upperCaseLetters$ = new BehaviorSubject(false);
  numbers$ = new BehaviorSubject(false);
  specialCharacters$ = new BehaviorSubject(false);

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    const pt = this.passwordType;
    this.fixedLength = pt.minLength != null && pt.minLength == pt.maxLength ? pt.minLength : null;
    this.minLength = pt.minLength != null && pt.minLength != pt.maxLength ? pt.minLength : null;
    this.lowerCaseLetters = pt.lowerCaseLetters == AvailabilityEnum.REQUIRED;
    this.upperCaseLetters = pt.upperCaseLetters == AvailabilityEnum.REQUIRED;
    this.numbers = pt.numbers == AvailabilityEnum.REQUIRED;
    this.specialCharacters = pt.specialCharacters == AvailabilityEnum.REQUIRED;

    this.addSub(this.control.valueChanges.subscribe(v => {
      v = v ?? '';
      this.fixedLength$.next(v.length == this.fixedLength && (!this.passwordType.onlyNumeric || isNumeric(v)));
      this.minLength$.next(v.length >= this.minLength && (!this.passwordType.onlyNumeric || isNumeric(v)));
      this.lowerCaseLetters$.next(LowerCaseLetters.test(v));
      this.upperCaseLetters$.next(UpperCaseLetters.test(v));
      this.numbers$.next(Numbers.test(v));
      this.specialCharacters$.next(SpecialCharacters.test(v));
    }));
  }
}
