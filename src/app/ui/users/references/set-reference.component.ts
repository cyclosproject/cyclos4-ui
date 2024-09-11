import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ReferenceDataForSet, ReferenceLevelEnum } from 'app/api/models';
import { ReferencesService } from 'app/api/services/references.service';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * Set or edit a reference given to other user
 */
@Component({
  selector: 'set-reference',
  templateUrl: 'set-reference.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetReferenceComponent extends BasePageComponent<ReferenceDataForSet> implements OnInit {
  ReferenceLevelEnum = ReferenceLevelEnum;

  id: string;
  from: string;
  to: string;
  create: boolean;
  self: boolean;
  form: FormGroup;

  constructor(injector: Injector, private referencesService: ReferencesService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.from = this.route.snapshot.params.from;
    this.to = this.route.snapshot.params.to;
    this.id = this.route.snapshot.params.id;
    this.create = this.id == null;

    const request: Observable<ReferenceDataForSet> = this.create
      ? this.referencesService.getReferenceDataForSet({
          from: this.from,
          to: this.to
        })
      : this.referencesService.getReferenceDataForEdit({ id: this.id });
    this.addSub(
      request.subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: ReferenceDataForSet) {
    const ref = data.reference;

    this.form = this.formBuilder.group({
      level: [ref.level, Validators.required],
      comments: [ref.comments, Validators.required],
      version: ref.version
    });
  }

  /**
   * Saves or edits the current reference
   */
  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value;
    const request: Observable<string | void> = this.create
      ? this.referencesService.setReference({ body: value, from: this.ApiHelper.SELF, to: this.data.to.id })
      : this.referencesService.updateReference({ id: this.id, body: value });
    this.addSub(
      request.subscribe(() => {
        this.notification.snackBar(this.i18n.reference.referenceSet);
        history.back();
      })
    );
  }

  resolveMenu(data: ReferenceDataForSet) {
    return this.menu.userMenu(data.from, Menu.REFERENCES);
  }
}
