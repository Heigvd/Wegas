import { TranslatableContent } from '../i18n';
import { VariableDescriptor, GameModel } from '../selectors';

export function editorLabel(vd: IVariableDescriptor) {
  const label = TranslatableContent.toString(vd.label);
  if (vd.editorTag && label) {
    return `${vd.editorTag} - ${label}`;
  }
  return vd.editorTag || label;
}

export function getParent(vd: IVariableDescriptor): IParentDescriptor {
  if (vd.parentDescriptorType === 'VariableDescriptor') {
    return (VariableDescriptor.select(
      vd.parentDescriptorId,
    ) as any) as IParentDescriptor;
  }
  return GameModel.select(vd.parentDescriptorId);
}
