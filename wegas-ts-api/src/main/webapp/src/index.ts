/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {IMergeable, ITeam, IListDescriptor} from '../typings/WegasEntities';
import {AtClassToConcrtetableClasses, mapAtClassToConcreteClasses, AtClassToConcreteClasses} from './generated/WegasScriptableEntities';
import {WegasClassNameAndScriptableTypes} from '../typings/WegasScriptableEntities';

export type ScriptableEntity<T extends IMergeable> = WegasClassNameAndScriptableTypes[T['@class']];

export type MapOf<T> = {[key: string]: T, [key: number]: T};

export class WegasClient {

    /**
     * Some classes require user to implement some methods.
     * User has to provide those implementation with this function.
     * @param implementations
     */
    constructor(private implementations: AtClassToConcrtetableClasses) {}

    /**
     * Create a Scriptable Entity from a IAbstractEntity.
     *
     * @param entity IAbstractEntity
     */
    //instantiate<T extends IMergeable>(entity: T): Readonly<StronglyTypedEntity<T>>;
    //instantiate(entity?: null): undefined;

    oldInstantiate<T extends IMergeable | undefined | null>(entity: T): T extends IMergeable ? ScriptableEntity<T> : undefined {
        if (entity) {
            if (entity["@class"] in mapAtClassToConcreteClasses) {
                const atClass = entity["@class"] as keyof AtClassToConcreteClasses;
                return new mapAtClassToConcreteClasses[atClass](this, entity as any) as any;
            } else if (entity["@class"] in this.implementations) {
                const atClass = entity["@class"] as keyof AtClassToConcrtetableClasses;
                return new this.implementations[atClass]!(this, entity as any) as any;
            } else {
                throw Error("Cannot instantiate abstract class " + entity["@class"] + "!");
            }
        }
        return undefined as any;
    }

    //instantiateArray<T extends IMergeable>(entities: T[]): Readonly<ScriptableEntity<T>>[];
    //instantiateArray(entities?: null): undefined;

    oldInstantiateArray<T extends IMergeable[] | null | undefined>(entities: T):
        T extends (infer U)[] ?
        U extends IMergeable ?
        ScriptableEntity<U>[]
        : undefined
        : undefined {
        if (entities) {
            return entities.map(e => this.instantiate(e)) as any;
        }
        return undefined as any;
    }

    oldInstantiateMap<T extends MapOf<IMergeable> | null | undefined>(entities: T)
        : T extends MapOf<infer U>
        ? (U extends IMergeable
            ? Readonly<MapOf<ScriptableEntity<U>>>
            : undefined)
        : undefined {
        if (entities) {
            // one would set any to U...
            const result: MapOf<ScriptableEntity<any>> = {};
            for (const key in entities) {
                if (entities[key]) {
                    result[key] = this.instantiate(entities[key]);
                }
            }
            return result as any;
        }
        return undefined as any;
    }

    instantiate<T extends IMergeable | IMergeable[] | MapOf<IMergeable> | null | undefined>(entities: T):
        T extends IMergeable // entity as-is
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
            )
        ) {
        if ("@class" in entities) {
            const entity = entities as IMergeable;
            if (entity["@class"] in mapAtClassToConcreteClasses) {
                const atClass = entity["@class"] as keyof AtClassToConcreteClasses;
                return new mapAtClassToConcreteClasses[atClass](this, entity as any) as any;
            } else if (entity["@class"] in this.implementations) {
                const atClass = entity["@class"] as keyof AtClassToConcrtetableClasses;
                return new this.implementations[atClass]!(this, entity as any) as any;
            } else {
                throw Error("Cannot instantiate abstract class " + entity["@class"] + "!");
            }
        } else if (Array.isArray(entities)) {
            return entities.map(e => this.instantiate(e)) as any;
        } else {typeof entities === "object"} {
            // one would set any to U...
            const result: MapOf<ScriptableEntity<any>> = {};
            for (const key in entities) {
                if (entities[key]) {
                    result[key] = this.instantiate(entities[key]);
                }
            }
            return result as any;
        }
        return undefined as any;
    }


    test() {

        const listDesc: IListDescriptor = {
            "@class": "ListDescriptor",
            allowedTypes: [], addShortcut: '', itemsIds: [], editorTag: "", comments: "", defaultInstance: {"@class": "ListInstance", version: 1},
            version: 1, label: {"@class": "TranslatableContent", version: 1, translations: {}}
        };
        console.log(listDesc);
        const team: ITeam = {"@class": "Team", players: []};
        const a: ITeam[] = [
            {"@class": "Team", players: []},
            {"@class": "Team", players: []},
            {"@class": "Team", players: []},
            {"@class": "Team", players: []},
            {"@class": "Team", players: []}
        ];
        const m: {[k: string]: ITeam} = {
            "a": {"@class": "Team", players: []},
            "b": {"@class": "Team", players: []},
            "c": {"@class": "Team", players: []},
            "d": {"@class": "Team", players: []},
            "e": {"@class": "Team", players: []}
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
};