type IAbstractEntity = import('wegas-ts-api/typings/WegasEntities').IAbstractEntity;

interface IParentDescriptor extends IAbstractEntity {
    itemsIds: number[];
}
