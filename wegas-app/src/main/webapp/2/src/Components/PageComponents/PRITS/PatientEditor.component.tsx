import { css, cx } from 'emotion';
import { omit, pick } from 'lodash-es';
import * as React from 'react';
import {
  IListDescriptor,
  IStringDescriptor,
  IVariableDescriptor,
  IVariableInstance,
  SListDescriptor,
  SStringDescriptor,
  STextDescriptor,
} from 'wegas-ts-api';
import { ITextDescriptor } from 'wegas-ts-api/typings/WegasEntities';
import { VariableDescriptorAPI } from '../../../API/variableDescriptor.api';
import {
  expandHeight,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  textCenter,
} from '../../../css/classes';
import { manageResponseHandler } from '../../../data/actions';
import { updateInstance } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { GameModel, Player, VariableDescriptor } from '../../../data/selectors';
import { store, useStore } from '../../../data/store';
import { createTranslatableContent } from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import HTMLEditor from '../../HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Style/ThemeVars';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

const patientListStyle = css({
  margin: '5px',
  padding: '2px',
  borderStyle: 'inset',
  borderColor: themeVar.Common.colors.BorderColor,
});

const patientListItemStyle = css({
  margin: '5px',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  boxShadow: `2px 2px 2px ${themeVar.Common.colors.HoverColor}`,
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.Common.colors.BackgroundColor,
  },
});

const newPatientStyle = css({
  backgroundColor: themeVar.Common.colors.DisabledColor,
  textAlign: 'center',
});

interface PatientListProps {
  patientsListName: string;
}

interface PatientListCallbacks {
  onItemClick: (itemId?: number) => void;
}

function PatientList({
  patientsListName,
  onItemClick,
}: PatientListProps & PatientListCallbacks) {
  const player = instantiate(useStore(Player.selectCurrent));
  const patients = instantiate(
    useStore(() =>
      VariableDescriptor.findByName<IListDescriptor>(patientsListName),
    ),
  );

  return (
    <div className={cx(flex, flexColumn, expandHeight, expandWidth)}>
      <h2 className={textCenter}>Patients</h2>
      <div className={cx(flex, flexColumn, grow, patientListStyle)}>
        <div
          className={cx(patientListItemStyle, newPatientStyle)}
          onClick={() => onItemClick(undefined)}
        >
          Ajouter un nouveau patient
        </div>
        {(patients?.getItems() || []).map((patientFolder: SListDescriptor) => {
          const patientName = patientFolder
            .getItems()
            .find(attr => attr.getEditorTag() === 'nom') as
            | SStringDescriptor
            | undefined;
          return (
            <div
              key={patientFolder.getId()}
              className={patientListItemStyle}
              onClick={() => onItemClick(patientFolder.getId())}
            >
              {patientName?.getValue(player)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const patientEditionFormStyle = css({
  display: 'grid',
  gridTemplateColumns: '50% 50%',
});

interface PatientEditionProps {
  patientId: number;
  onClickBack: () => void;
}

function PatientEdition({ patientId, onClickBack }: PatientEditionProps) {
  const { lang } = React.useContext(languagesCTX);
  const player = instantiate(useStore(Player.selectCurrent));
  const patient = instantiate(
    useStore(() => VariableDescriptor.select<IListDescriptor>(patientId)),
  );

  const description = patient
    ?.getItems()
    .find(item => item.getEditorTag() === 'description') as STextDescriptor;

  return (
    <div className={cx(flex, flexColumn, expandHeight, expandWidth)}>
      <div className={cx(flex, flexRow, itemCenter)}>
        <Button icon="arrow-left" onClick={onClickBack} />
        <h2 className={cx(grow, textCenter)}>Patient</h2>
      </div>

      <div className={cx(grow, patientEditionFormStyle)}>
        <div>Id</div>
        <div>{patientId}</div>
        <div>Description</div>
        <HTMLEditor
          value={description?.getValue(player)}
          onChange={value =>
            dispatch(
              updateInstance({
                ...description.getInstance(player).getEntity(),
                trValue: createTranslatableContent(lang, value),
              } as IVariableInstance),
            )
          }
        />
      </div>
    </div>
  );
}

const dispatch = store.dispatch;

function compareVariables(
  var1: { [attr: string]: unknown },
  var2: { [attr: string]: unknown },
): boolean {
  let same = true;
  for (const attr in var1) {
    const attr1 = var1[attr];
    const attr2 = var2[attr];
    if (
      typeof attr1 === 'object' &&
      attr1 !== null &&
      typeof attr2 === 'object' &&
      attr2 !== null
    ) {
      same =
        same &&
        compareVariables(
          attr1 as { [attr: string]: unknown },
          attr2 as { [attr: string]: unknown },
        );
    } else if (attr1 !== attr2) {
      return false;
    }
  }
  return true;
}

function createVariable(
  gameModelId: number,
  variableDescriptor: IVariableDescriptor,
  parent?: IParentDescriptor,
) {
  return VariableDescriptorAPI.post(
    gameModelId,
    variableDescriptor,
    parent,
  ).then(res => {
    dispatch(manageResponseHandler(res));
    const trimmedVD = omit(variableDescriptor, [
      'id',
      'defaultInstance',
      'version',
    ]);
    const newVariable = res.updatedEntities.find(e => {
      const pickedDescriptor = pick(e, Object.keys(trimmedVD));
      const test = compareVariables(trimmedVD, pickedDescriptor);
      return test;
    });
    return newVariable;
  });
}

function createEmptyListDescriptor(
  label: ITranslatableContent,
  editorTag: string = '',
): IListDescriptor {
  return {
    '@class': 'ListDescriptor',
    editorTag,
    label,
    version: 0,
    comments: '',
    addShortcut: '',
    allowedTypes: [],
    itemsIds: [],
    defaultInstance: { '@class': 'ListInstance', version: 0 },
  };
}

function createEmptyTextDescriptor(
  label: ITranslatableContent,
  editorTag: string = '',
): ITextDescriptor {
  return {
    '@class': 'TextDescriptor',
    editorTag,
    label,
    version: 0,
    comments: '',
    defaultInstance: {
      '@class': 'TextInstance',
      version: 0,
      trValue: createTranslatableContent(),
    },
  };
}

function createEmptyStringDescriptor(
  label: ITranslatableContent,
  editorTag: string = '',
): IStringDescriptor {
  return {
    '@class': 'StringDescriptor',
    editorTag,
    label,
    version: 0,
    comments: '',
    allowedValues: [],
    defaultInstance: {
      '@class': 'StringInstance',
      version: 0,
      trValue: createTranslatableContent(),
    },
  };
}

type PatientEditorProps = WegasComponentProps & PatientListProps;

function PatientEditor({ patientsListName }: PatientEditorProps) {
  const [currentPatient, setCurrentPatient] = React.useState<
    number | undefined
  >();

  const { lang } = React.useContext(languagesCTX);
  const gameModel = useStore(GameModel.selectCurrent);
  const patients = useStore(() =>
    VariableDescriptor.findByName<IListDescriptor>(patientsListName),
  );
  const spatients = instantiate(patients);

  const onPatientClick = React.useCallback(
    (patientId?: number) => {
      const lastTag = String(
        (
          spatients
            ?.getItems()
            .map(patient => Number(patient.getEditorTag())) || [0]
        ).slice(-1)[0] + 1,
      );

      if (patientId == null) {
        createVariable(
          gameModel.id!,
          createEmptyListDescriptor(
            createTranslatableContent(lang, lastTag),
            lastTag,
          ),
          patients,
        ).then((newPatient: IListDescriptor) => {
          if (newPatient) {
            createVariable(
              gameModel.id!,
              createEmptyTextDescriptor(
                createTranslatableContent(lang, 'portrait'),
                'portrait',
              ),
              newPatient,
            ).then(() =>
              createVariable(
                gameModel.id!,
                createEmptyStringDescriptor(
                  createTranslatableContent(lang, 'nom'),
                  'nom',
                ),
                newPatient,
              ).then(() =>
                createVariable(
                  gameModel.id!,
                  createEmptyTextDescriptor(
                    createTranslatableContent(lang, 'description'),
                    'description',
                  ),
                  newPatient,
                )
                  .then(() =>
                    createVariable(
                      gameModel.id!,
                      createEmptyListDescriptor(
                        createTranslatableContent(lang, 'histoires'),
                        'histoires',
                      ),
                      newPatient,
                    ),
                  )
                  .then(() => {
                    setCurrentPatient(newPatient.id);
                  }),
              ),
            );
          }
        });
      } else {
        setCurrentPatient(patientId);
      }
    },
    [patients, gameModel, spatients, lang],
  );

  return currentPatient == null ? (
    <PatientList
      patientsListName={patientsListName}
      onItemClick={onPatientClick}
    />
  ) : (
    <PatientEdition
      patientId={currentPatient}
      onClickBack={() => setCurrentPatient(undefined)}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PatientEditor,
    componentType: 'Other',
    name: 'PRITS Patient editor',
    icon: 'list',
    schema: {
      patientsListName: schemaProps.string({
        label: 'Patient list name',
        value: 'patients',
      }),
    },
    getComputedPropsFromVariable: () => ({ patientsListName: 'patients' }),
  }),
);
