type IVariableDescriptor = import('wegas-ts-api').IVariableDescriptor;
type SAbstractEntity = import('wegas-ts-api').SAbstractEntity;
type IVariableInstance = import('wegas-ts-api').IVariableInstance;

/**
 * These methods will work only in editor context
 */
interface APIMethodsClass {
  createVariable: (
    gameModelId: number,
    variableDescriptor: IVariableDescriptor,
    parent?: IParentDescriptor,
    callback?: (res?: SAbstractEntity) => void,
  ) => void;
  deleteVariable: (variable: IVariableDescriptor) => void;
  updateInstance: (instance: IVariableInstance) => void;
}
