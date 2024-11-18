import { translate } from '../i18n';
import {
  VariableDescriptor,
  VariableInstance,
  GameModel,
  Player,
} from '../selectors';
import { store } from '../Stores/store';
import {
  ITranslatableContent,
  IVariableDescriptor,
  IVariableInstance,
  IPlayer,
  ITeam,
  IGameModel,
  ScriptableEntity,
} from 'wegas-ts-api';
import { SVariableDescriptor, SVariableInstance, SPlayer } from 'wegas-ts-api';
import { instantiate } from '../scriptable';

export function editorLabel(vd?: {
  label?: ITranslatableContent;
  editorTag?: string | null;
  name?: string;
  index?: string;
}) {
  let label = translate(vd?.label);
  if (vd?.index) {
    label = `${vd?.index}. ${label}`;
  }

  // if (!showTag && label) {
  //   return label;
  // }
  if (vd && vd.editorTag && label) {
    return `${ vd.editorTag } - ${ label }`;
  }
  return (vd && (vd.editorTag || label || vd.name)) || '';
}

export function editorTitle({label, editorTag, name, index}: {
  label?: ITranslatableContent;
  editorTag?: string | null;
  name?: string;
  index?: string;
}) {
  let trLabel = translate(label);
  if (index) {
    trLabel = `${index}. ${trLabel}`;
  }
  return [editorTag, trLabel, name].filter(s => s).join(' - ');
}

export function getParent(vd: IVariableDescriptor): IParentDescriptor {
  if (vd.parentType!.endsWith('Descriptor')) {
    return VariableDescriptor.select(
      vd.parentId,
    ) as unknown as IParentDescriptor;
  }
  return GameModel.select(vd.parentId!);
}

/**
 * Cache for getInstance
 */
const instancesCache = new Map<string, number>();

export function getScriptableInstance<T extends SVariableInstance>(
  vd: SVariableDescriptor<T>,
  player: Readonly<SPlayer>,
): T {
  const instance = instantiate(getInstance(vd.getEntity(), player.getEntity()));
  if (instance) {
    // Should be typed better but we know it works
    return instance as unknown as T;
  } else {
    throw Error('No Instance found');
  }
}

export function getInstance<I extends IVariableInstance>(
  vd:
    | IVariableDescriptor<I>
    | SVariableDescriptor<ScriptableEntity<IVariableInstance>>,
  self?: IPlayer,
): Readonly<I> | undefined {
  type IorUndef = Readonly<I> | undefined;
  const player = self != null ? self : Player.selectCurrent();
  const variableDescriptor = '@class' in vd ? vd : vd.getEntity();
  const scopeType = variableDescriptor.scopeType;
  const parentId = variableDescriptor.id;
  const scopeKey =
    scopeType === 'PlayerScope'
      ? player.id
      : scopeType === 'TeamScope'
        ? player.parentId
        : 0;
  const cacheKey = `${ parentId }${ scopeType }${ scopeKey }`;

  const id = instancesCache.get(cacheKey);
  if (typeof id === 'number') {
    const instance = VariableInstance.select<I>(id);
    // Check if instance still exists and has the right parentId and scopeKey.
    if (instance != null) {
      return instance;
    }
    instancesCache.delete(cacheKey);
  }

  const instance = VariableInstance.firstMatch<IVariableInstance>({
    parentId,
    scopeKey,
  }) as IorUndef;
  if (instance != null && instance.id != null) {
    instancesCache.set(cacheKey, instance.id!);
  }
  return instance;
}

export function getScopeEntity(
  vi: Readonly<{ parentId?: number | null; scopeKey?: number | null }>,
): IPlayer | ITeam | IGameModel | undefined {
  const vd = VariableDescriptor.select(vi.parentId);
  if (vd == null || vi.scopeKey == null) {
    return undefined;
  }
  const state = store.getState();
  switch (vd.scopeType) {
    case 'PlayerScope':
      return state.players[vi.scopeKey];
    case 'TeamScope':
      return state.teams[vi.scopeKey];
    case 'GameModelScope':
      return state.gameModels[vi.scopeKey];
  }
}

export function getItems<T = SVariableDescriptor<SVariableInstance>>(
  itemsIds: number[],
): Readonly<T[]> {
  return itemsIds
    .map(itemId => instantiate(VariableDescriptor.select(itemId)))
    .filter(items => items != null) as unknown as Readonly<T[]>;
}
