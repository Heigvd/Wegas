import { css, cx } from 'emotion';
import { omit, pick } from 'lodash-es';
import * as React from 'react';
import {
  IListDescriptor,
  IStringDescriptor,
  IStringInstance,
  ITextInstance,
  IVariableDescriptor,
  IVariableInstance,
  SListDescriptor,
  SStringDescriptor,
} from 'wegas-ts-api';
import { ITextDescriptor } from 'wegas-ts-api/typings/WegasEntities';
import { fileURL, generateAbsolutePath } from '../../../API/files.api';
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
import { FileBrowser } from '../../../Editor/Components/FileBrowser/FileBrowser';
import {
  createTranslatableContent,
  translate,
} from '../../../Editor/Components/FormView/translatable';
import { TextPrompt } from '../../../Editor/Components/TextPrompt';
import { wlog } from '../../../Helper/wegaslog';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import HTMLEditor from '../../HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
import { inputStyle } from '../../Inputs/inputStyles';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { Modal } from '../../Modal';
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
      <div className={cx(flex, flexColumn, grow, patientListStyle, inputStyle)}>
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
  gridTemplateColumns: '30% 70%',
  gridAutoRows: '100px',
  alignItems: 'center',
});

const leftGridCellStyle = css({
  justifySelf: 'center',
});

const portraitStyle = css({
  position: 'relative',
  width: '200px',
  height: '200px',
  borderRadius: '100px',
  overflow: 'hidden',
  '&>div': {
    height: '100%',
  },
});

const portraitClickStyle = css({
  position: 'absolute',
  display: 'flex',
  top: 0,
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
});

// interface PatientHistoryListProps {}

function PatientHistoryList(/*props: PatientHistoryListProps*/) {
  const newHistoryButton = React.useRef(null);
  const [newHistory, setNewHistory] = React.useState<boolean>(false);

  useOnClickOutside(newHistoryButton, () => setNewHistory(false));

  return (
    <div>
      <h3 className={cx(grow, textCenter)}>Histoires</h3>
      <div className={cx(flex, flexColumn, inputStyle)}>
        {newHistory ? (
          <div
            className={cx(flex, flexRow, patientListItemStyle, newPatientStyle)}
          >
            Nom :
            <TextPrompt
              className={cx(flex, flexRow, grow)}
              onAction={() => {
                setNewHistory(false);
              }}
            />
          </div>
        ) : (
          <div
            ref={newHistoryButton}
            className={cx(patientListItemStyle, newPatientStyle)}
            onClick={() => setNewHistory(true)}
          >
            Ajouter une nouvelle histoire
          </div>
        )}
      </div>
    </div>
  );
}

interface PatientEditionProps {
  patientId: number;
  onClickBack: () => void;
}

function PatientEdition({ patientId, onClickBack }: PatientEditionProps) {
  const [browsingFile, setBrowsingFile] = React.useState<boolean>(false);
  const { lang } = React.useContext(languagesCTX);
  const player = instantiate(useStore(Player.selectCurrent));

  const { portrait, nom, description } = useStore(() => {
    const patient = instantiate(
      VariableDescriptor.select<IListDescriptor>(patientId),
    );
    const portrait = patient
      ?.getItems()
      .find(item => item.getEditorTag() === 'portrait')
      ?.getInstance(player)
      ?.getEntity() as ITextInstance;
    const nom = patient
      ?.getItems()
      .find(item => item.getEditorTag() === 'nom')
      ?.getInstance(player)
      ?.getEntity() as IStringInstance;
    const description = patient
      ?.getItems()
      .find(item => item.getEditorTag() === 'description')
      ?.getInstance(player)
      ?.getEntity() as ITextInstance;

    wlog(translate(nom?.trValue, lang));

    return { portrait, nom, description };
  }, deepDifferent);

  return (
    <div
      className={cx(
        flex,
        flexColumn,
        expandHeight,
        expandWidth,
        css({ padding: '5px' }),
      )}
    >
      <div className={cx(flex, flexRow, itemCenter)}>
        <Button icon="arrow-left" onClick={onClickBack} />
        <h2 className={cx(grow, textCenter)}>Patient</h2>
      </div>

      <div className={cx(grow, patientEditionFormStyle)}>
        {browsingFile && (
          <Modal onExit={() => setBrowsingFile(false)}>
            <FileBrowser
              onFileClick={file => {
                setBrowsingFile(false);
                if (file) {
                  dispatch(
                    updateInstance({
                      ...portrait,
                      trValue: createTranslatableContent(
                        lang,
                        `<div style="background-image: url('${fileURL(
                          generateAbsolutePath(file),
                        )}'); width: 100%; height: 100%; background-position: center; background-size: contain; background-repeat: no-repeat;">&nbsp;</div>`,
                      ),
                    } as IVariableInstance),
                  );
                }
              }}
              pick={'FILE'}
              filter={{ fileType: 'image', filterType: 'show' }}
            />
          </Modal>
        )}
        <div>Id</div>
        <div className={leftGridCellStyle}>{patientId}</div>
        <div>Portrait</div>
        <div className={cx(leftGridCellStyle, portraitStyle)}>
          <div
            dangerouslySetInnerHTML={{
              __html: translate(portrait.trValue, lang) || '',
            }}
          />
          <div className={portraitClickStyle}>
            <Button
              icon={{ icon: 'download', size: '5x' }}
              onClick={() => setBrowsingFile(true)}
            />
          </div>
          {/* <div className={portraitClickStyle}>Insert image</div> */}
        </div>
        <div>Nom</div>
        <SimpleInput
          className={leftGridCellStyle}
          value={translate(nom.trValue, lang)}
          onChange={value => {
            dispatch(
              updateInstance({
                ...nom,
                trValue: createTranslatableContent(lang, String(value)),
              } as IVariableInstance),
            );
          }}
        />
        <div>Description</div>
        <HTMLEditor
          className={leftGridCellStyle}
          value={translate(description.trValue, lang)}
          onChange={value =>
            dispatch(
              updateInstance({
                ...description,
                trValue: createTranslatableContent(lang, value),
              } as IVariableInstance),
            )
          }
        />
      </div>
      <PatientHistoryList />
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
