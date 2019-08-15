import { TranslatableContent } from '../i18n';
import {
  VariableDescriptor,
  VariableInstance,
  GameModel,
  Player,
} from '../selectors';

export function editorLabel(vd: {
  label: ITranslatableContent;
  editorTag?: string | null;
  name?: string;
}) {
  const label = TranslatableContent.toString(vd.label);
  if (vd.editorTag && label) {
    return `${vd.editorTag} - ${label}`;
  }
  return vd.editorTag || label || vd.name || '';
}

export function getParent(vd: IVariableDescriptor): IParentDescriptor {
  if (vd.parentType!.endsWith('Descriptor')) {
    return (VariableDescriptor.select(
      vd.parentId,
    ) as unknown) as IParentDescriptor;
  }
  return GameModel.select(vd.parentId!);
}

export function getInstance<I extends IVariableInstance>(
  vd: IVariableDescriptor<I>,
  self?: IPlayer,
): Readonly<I> | undefined {
  type IorUndef = Readonly<I> | undefined;
  const player = self != null ? self : Player.selectCurrent();
  switch (vd.scopeType) {
    case 'PlayerScope':
      return VariableInstance.firstMatch<IVariableInstance>({
        parentId: vd.id,
        scopeKey: player.id,
      }) as IorUndef;
    case 'TeamScope':
      return VariableInstance.firstMatch<IVariableInstance>({
        parentId: vd.id,
        scopeKey: player.parentId,
      }) as IorUndef;
    case 'GameModelScope':
      return VariableInstance.firstMatch<IVariableInstance>({
        parentId: vd.id,
        scopeKey: 0,
      }) as IorUndef;
  }
}
