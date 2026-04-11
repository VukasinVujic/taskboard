import { CanComponentDeactivate } from '../../shared/models/can-component-deactivate';

export const pendingChanges = (component: CanComponentDeactivate) => {
  return component.canDeactivate();
};
