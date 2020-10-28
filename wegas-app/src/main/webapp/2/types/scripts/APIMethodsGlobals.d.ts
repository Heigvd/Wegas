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
    callback?: (res?: SVariableDescriptor) => void,
  ) => void;
  duplicateVariable: (
    variable: IVariableDescriptor,
    callback?: (res?: SVariableDescriptor) => void,
  ) => void;
  moveVariable: (
    variable: IVariableDescriptor,
    parent: IParentDescriptor,
    index: number,
    callback?: (res?: SVariableDescriptor) => void,
  ) => void;
  updateVariable: (instance: IVariableDescriptor) => void;
  deleteVariable: (variable: IVariableDescriptor) => void;
  updateInstance: (variable: IVariableInstance) => void;
}
