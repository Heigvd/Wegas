import jsonFetch from './wegasFetch';
import {IVariableDescriptor, IGameAdminWithId, WegasClassNames, WegasClassNamesAndClasses, SVariableDescriptor} from 'wegas-ts-api';
import InheritanceTable from 'wegas-ts-api/typings/Inheritance.json';

const PUBLIC = 'Public';
const EXPORT_VIEW = 'Export';

function basePath(view: string = PUBLIC): string {
  return `/rest/${view}/GameModel/`;
}

export interface WithItems {
  items: IVariableDescriptor[];
}

export async function getVariables(gmId: number): Promise<IVariableDescriptor[]> {
  const gameModel = await jsonFetch(`${basePath(EXPORT_VIEW)}${gmId}`) as WithItems;

  return gameModel.items;
}

export type GameAdmin = IGameAdminWithId & {gameModelId: number}

export async function getGameModelForGame(gameId: number): Promise<number> {
  const response = await jsonFetch(`${basePath()}Game/${gameId}`) as GameAdmin;
  return response.gameModelId;
}

export async function getGamesByIds(ids: number[]): Promise<GameAdmin[]> {
  return jsonFetch(`/rest/Admin/GamesByIds`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ids)
  });
}

type Mergeable = keyof typeof InheritanceTable;

function inherit(cls: string, type: Mergeable): boolean {
  if (cls in InheritanceTable) {
    const ext = InheritanceTable[cls as Mergeable];
    if (ext.includes(type)) {
      return true;
    }
    const extCls = ext[0];
    if (typeof extCls === 'string') {
      return inherit(extCls, type);
    }
  }
  return false;
}

/**
 * Check entity type.
 * @param variable Variable to test
 * @param cls Discriminant, class
 * @param inheritance Return true if class is inherited from searched class
 */
export function entityIs<T extends WegasClassNames>(
  variable: unknown,
  cls: T,
  inheritance?: boolean,
): variable is WegasClassNamesAndClasses[T] {
  if ('object' === typeof variable && variable !== null) {
    const entity =
      'getEntity' in variable ? (variable as SVariableDescriptor).getEntity() : variable;
    const variableClass = (entity as Record<string, unknown>)['@class'] as Mergeable;
    return (
      variableClass === cls ||
      (variableClass !== undefined && inheritance === true && inherit(variableClass, cls))
    );
  }
  return false;
}
