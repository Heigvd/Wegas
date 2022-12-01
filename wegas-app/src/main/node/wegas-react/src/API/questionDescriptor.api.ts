import { managedModeRequest } from './rest';
import {
  IChoiceDescriptor,
  IReply,
  IQuestionInstance,
  IWhQuestionDescriptor,
  IQuestionDescriptor,
  IWhQuestionInstance,
} from 'wegas-ts-api';

const QD_BASE = (gameModelId: number) =>
  `/GameModel/${gameModelId}/VariableDescriptor/QuestionDescriptor/`;
export const QuestionDescriptorAPI = {
  read(
    gameModelId: number,
    playerId: number,
    choice: IChoiceDescriptor | IQuestionDescriptor | IWhQuestionDescriptor,
  ) {
    return managedModeRequest(
      `${QD_BASE(gameModelId)}Read/${playerId}/${choice.id}`,
      {
        method: 'PUT',
      },
    );
  },
  selectChoice(
    gameModelId: number,
    playerId: number,
    choice: IChoiceDescriptor,
  ) {
    return managedModeRequest(
      `${QD_BASE(gameModelId)}SelectChoice/${
        choice.id
      }/Player/${playerId}/StartTime/0`,
      {
        method: 'GET',
      },
    );
  },
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
  cancelReply(gameModelId: number, playerId: number, reply: IReply) {
    return managedModeRequest(
      `${QD_BASE(gameModelId)}CancelReply/${reply.id}/Player/${playerId}`,
      {
        method: 'GET',
      },
    );
  },
  validateQuestion(
    gameModelId: number,
    playerId: number,
    question: IQuestionInstance | IWhQuestionInstance,
  ) {
    return managedModeRequest(
      `${QD_BASE(gameModelId)}ValidateQuestion/${
        question.id
      }/Player/${playerId}`,
      {
        method: 'POST',
      },
    );
  },
};
