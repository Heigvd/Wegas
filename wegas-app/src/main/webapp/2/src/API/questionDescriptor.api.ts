import { managedModeRequest } from './rest';

const QD_BASE = (gameModelId: number) =>
  `/GameModel/${gameModelId}/VariableDescriptor/QuestionDescriptor/`;
export const QuestionDescriptorAPI = {
  selectAndValidate(
    gameModelId: number,
    playerId: number,
    choice: IChoiceDescriptor,
  ) {
    return managedModeRequest(
      `${QD_BASE(gameModelId)}SelectAndValidateChoice/${
        choice.id
      }/Player/${playerId}`,
      {
        method: 'POST',
      },
    );
  },
};
