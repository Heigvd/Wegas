/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {
  IMergeable,
  ITeam,
  IListDescriptor,
  WegasClassNamesAndClasses,
} from "..";
import {
  AtClassToConcrtetableClasses,
  mapAtClassToConcreteClasses,
  AtClassToConcreteClasses,
  WegasClassNameAndScriptableTypes,
  AtClassToConcrtetableTypes,
} from "./generated/WegasScriptableEntities";

export type ScriptableEntity<T extends IMergeable> =
  WegasClassNameAndScriptableTypes[T["@class"]];

export type MapOf<T> = Record<string | number, T>;

export type ConcretableFactory = {
  [P in keyof AtClassToConcrtetableClasses]: (
    client: WegasClient,
    enttiy: WegasClassNamesAndClasses[P]
  ) => AtClassToConcrtetableTypes[P];
};

export class WegasClient {
  /**
   * Some classes require user to implement some methods.
   * User has to provide those implementation with this function.
   * @param implementations
   */
  constructor(private implementations: ConcretableFactory) {}

  /**
   * Create a Scriptable Entity from a IAbstractEntity.
   * Create a Scriptable Entity Array from a IAbstractEntity[].
   * Create a Scriptable Entity Map from a IAbstractEntity map.
   *
   * @param entity entity or entites to instantiate
   */
  // prettier-ignore
  instantiate<T extends IMergeable | IMergeable[] | MapOf<IMergeable> | null | undefined>(entities: T):
        T extends undefined ? undefined : T extends null ? null
        : (T extends IMergeable // entity as-is
            ? ScriptableEntity<T>  // -> return a ScriptableEntity
            : (
                T extends (infer U)[] ? // array of some U
                (
                    U extends IMergeable ? // two step: U extends, in fact, IMergeable
                    ScriptableEntity<U>[]   // return an array of ScriptableEntity
                    : undefined
                )
                : (
                    T extends MapOf<infer U> // T is a Map of some U
                    ? (U extends IMergeable   // and U extends IMergeable
                        ? Readonly<MapOf<ScriptableEntity<U>>> // -> Map of Scriptables
                        : undefined)
                    : undefined
                ))
        ) {
        if (entities == null) {
            return entities as any;
        } else if ("@class" in entities) {
            const entity = entities as IMergeable;
            if (entity["@class"] in mapAtClassToConcreteClasses) {
                const atClass = entity["@class"] as keyof AtClassToConcreteClasses;
                return new mapAtClassToConcreteClasses[atClass](this, entity as any) as any;
            } else if (entity["@class"] in this.implementations) {
                const atClass = entity["@class"] as keyof AtClassToConcrtetableClasses;
                return this.implementations[atClass]!(this, entity as any) as any;
            } else {
                throw Error("Cannot instantiate abstract class " + entity["@class"] + "!");
            }
        } else if (Array.isArray(entities)) {
            return entities.map(e => this.instantiate(e)) as any;
        } else {
            // one would set any to U...
            const result: MapOf<ScriptableEntity<any>> = {};
            Object.entries(entities).forEach(([key, entity]) => {
                result[key] = this.instantiate(entity);
            });
            return result as any;
        }
        return undefined as any;
    }

  test() {
    const listDesc: IListDescriptor = {
      "@class": "ListDescriptor",
      allowedTypes: [],
      addShortcut: "",
      itemsIds: [],
      editorTag: "",
      comments: "",
      defaultInstance: {
        "@class": "ListInstance",
        version: 1,
      },
      version: 1,
      label: {
        "@class": "TranslatableContent",
        version: 1,
        translations: {},
      },
    };
    console.log(listDesc);
    const team: ITeam = { "@class": "Team", players: [] };
    const a: ITeam[] = [
      { "@class": "Team", players: [] },
      { "@class": "Team", players: [] },
      { "@class": "Team", players: [] },
      { "@class": "Team", players: [] },
      { "@class": "Team", players: [] },
    ];
    const m: { [k: string]: ITeam } = {
      a: { "@class": "Team", players: [] },
      b: { "@class": "Team", players: [] },
      c: { "@class": "Team", players: [] },
      d: { "@class": "Team", players: [] },
      e: { "@class": "Team", players: [] },
    };

    const s = this.instantiate(team);
    console.log(s);
    const rs = this.instantiate(team as Readonly<ITeam>);
    console.log(rs);
    const sArray = this.instantiate(a);
    console.log(sArray);
    const sMap = this.instantiate(m);
    console.log(sMap);
  }
}

export * from "./generated/WegasScriptableEntities";
