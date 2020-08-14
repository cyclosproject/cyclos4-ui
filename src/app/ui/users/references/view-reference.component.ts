import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ReferenceView } from 'app/api/models';
import { ReferencesService } from 'app/api/services/references.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ReferenceHelperService } from 'app/ui/users/references/reference-helper.service';

/**
 * Displays a reference details
 */
@Component({
  selector: 'view-reference',
  templateUrl: 'view-reference.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewReferenceComponent extends BaseViewPageComponent<ReferenceView> implements OnInit {
  constructor(
    injector: Injector,
    private referencesService: ReferencesService,
    public referenceHelper: ReferenceHelperService) {
    super(injector);
  }

  id: string;
  self: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.referencesService.viewReference({ id: this.id }).subscribe(data =>
      this.data = data));
  }

  onDataInitialized(data: ReferenceView) {

    this.self = this.authHelper.isSelfOrOwner(data.from) ||
      this.authHelper.isSelfOrOwner(data.to);

    const actions = [];
    if (data.canEdit) {
      actions.push(
        new HeadingAction('edit', this.i18n.general.edit, () =>
          this.router.navigate(['/users', 'references', 'edit', this.id]), true,
        ));
    }
    this.headingActions = actions;
  }

  resolveMenu() {
    return this.self ? Menu.REFERENCES : this.menu.searchUsersMenu();
  }

}
