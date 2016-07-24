import { IActor } from 'sf-base/actors';
import { IApplication } from 'sf-base/application';
import { SelectAction } from 'sf-front-end/actions';
import { ApplicationServiceFragment } from 'sf-core/fragments';
import { BaseApplicationService } from 'sf-core/services';

export default class PointerTool extends BaseApplicationService<IApplication> {

  name = 'pointer';
  main = true;
  icon = 'cursor';
  stageCanvasMouseDown() {
    this.bus.execute(new SelectAction());
  }
}

export const fragment = new ApplicationServiceFragment('stage-tools/pointer', PointerTool);
