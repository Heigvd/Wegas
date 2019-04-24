import { TranslatableContent } from '../i18n';
import {
  VariableDescriptor,
  GameModel,
  VariableInstance,
  Player,
} from '../selectors';

export function editorLabel(vd: {
  label: ITranslatableContent;
  editorTag?: string | null;
}) {
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

export function getInstance<I extends IVariableInstance>(
  vd: IVariableDescriptor<I>,
) {
  return function(self?: IPlayer): Readonly<I> | undefined {
    type IorUndef = Readonly<I> | undefined;
    const player = self != null ? self : Player.selectCurrent();
      switch (vd.scopeType) {
      case 'PlayerScope':
        return VariableInstance.firstMatch<IVariableInstance>({
          descriptorId: vd.id,
          scopeKey: player.id,
        }) as IorUndef;
      case 'TeamScope':
        return VariableInstance.firstMatch<IVariableInstance>({
          descriptorId: vd.id,
          scopeKey: player.teamId,
        }) as IorUndef;
      case 'GameModelScope':
        return VariableInstance.firstMatch<IVariableInstance>({
          descriptorId: vd.id,
          scopeKey: 0,
        }) as IorUndef;
    }
  };
}
