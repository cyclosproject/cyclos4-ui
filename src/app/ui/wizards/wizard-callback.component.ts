import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { WizardExecutionData } from 'app/api/models';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { WizardsService } from 'app/api/services/wizards.service';

/**
 * Callback invoked after running an external redirect wizard step
 */
@Component({
  selector: 'wizard-callback',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardCallbackComponent
  extends BasePageComponent<WizardExecutionData>
  implements OnInit {

  constructor(
    injector: Injector,
    private wizardsService: WizardsService) {
    super(injector);
  }

  ngOnInit() {
    const route = this.route.snapshot;
    super.ngOnInit();
    this.addSub(this.wizardsService.runWizardCallback({
      key: route.params.key,
      body: {
        method: 'GET',
        parameters: route.queryParams,
      },
    }).subscribe(data => {
      this.stateManager.setGlobal(`wizard-execution-${data.key}`, data);
      this.router.navigate(['wizards', 'run', data.key], {
        replaceUrl: true
      });
    }));
  }

  resolveMenu() {
    // No need to resolve the menu, becase we'll redirect back to the execution
    return null;
  }

}
