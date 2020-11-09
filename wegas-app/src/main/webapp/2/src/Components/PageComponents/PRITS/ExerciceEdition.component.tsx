import { cx, css } from 'emotion';
import * as React from 'react';
import {
  IBooleanInstance,
  IListDescriptor,
  INumberDescriptor,
  IStringInstance,
  ITextInstance,
  SListDescriptor,
} from 'wegas-ts-api';
import { fileURL, generateAbsolutePath } from '../../../API/files.api';
import {
  flex,
  flexColumn,
  expandHeight,
  expandWidth,
  flexRow,
  itemCenter,
  grow,
  textCenter,
} from '../../../css/classes';
import { ActionCreator } from '../../../data/actions';
import { updateInstance } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player, VariableDescriptor } from '../../../data/selectors';
import { useStore, store } from '../../../data/store';
import { FileBrowser } from '../../../Editor/Components/FileBrowser/FileBrowser';
import {
  translate,
  createTranslatableContent,
} from '../../../Editor/Components/FormView/translatable';
import { CTree } from '../../../Editor/Components/Variable/VariableTree';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { clientScriptEval } from '../../Hooks/useScript';
import HTMLEditor from '../../HTMLEditor';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { Button } from '../../Inputs/Buttons/Button';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { Modal } from '../../Modal';
import { themeVar } from '../../Style/ThemeVars';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { OpenPageAction } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

const patientEditionFormStyle = css({
  display: 'grid',
  gridTemplateColumns: '30% 70%',
  gridRowGap: '20px',
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
  opacity: 0,
  ';hover': {
    opacity: 1,
  },
  position: 'absolute',
  display: 'flex',
  top: 0,
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
});

const portraitImgStyle = css({
  width: '100%',
});

const exerciceEditionStyle = css({
  borderRadius: '5px',
  borderStyle: 'solid',
  borderColor: themeVar.Common.colors.BorderColor,
  padding: '5px',
});

interface ExerciceEditionProps {
  exerciceId: number;
  onClickBack: () => void;
}

const dispatch = store.dispatch;

function ExerciceEdition({ exerciceId, onClickBack }: ExerciceEditionProps) {
  const [browsingFile, setBrowsingFile] = React.useState<boolean>(false);
  const { lang } = React.useContext(languagesCTX);
  const player = instantiate(useStore(Player.selectCurrent));

  const exerciceValues = useStore(() => {
    const exercice = instantiate(
      VariableDescriptor.select<IListDescriptor>(exerciceId),
    );

    if (!exercice) {
      return undefined;
    }

    const titre = exercice
      ?.getItems()
      .find(item => item.getEditorTag() === 'titre')
      ?.getInstance(player)
      ?.getEntity() as IStringInstance;
    const description = exercice
      ?.getItems()
      .find(item => item.getEditorTag() === 'description')
      ?.getInstance(player)
      ?.getEntity() as ITextInstance;
    const image = exercice
      ?.getItems()
      .find(item => item.getEditorTag() === 'image')
      ?.getInstance(player)
      ?.getEntity() as IStringInstance;
    const exercices = (exercice
      ?.getItems()
      .find(
        item => item.getEditorTag() === 'exercices',
      ) as SListDescriptor).getId();
    const active = exercice
      ?.getItems()
      .find(item => item.getEditorTag() === 'active')
      ?.getInstance(player)
      ?.getEntity() as IBooleanInstance;

    return { titre, description, image, exercices, active };
  }, deepDifferent);

  const exercices = exerciceValues?.exercices;

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
        <h2 className={cx(grow, textCenter)}>Exercice</h2>
      </div>

      {!exerciceValues ? (
        <span>Something went wrong. Please go back and try again.</span>
      ) : (
        <div className={cx(grow, patientEditionFormStyle)}>
          {browsingFile && (
            <Modal onExit={() => setBrowsingFile(false)}>
              <FileBrowser
                onFileClick={file => {
                  setBrowsingFile(false);
                  if (file) {
                    dispatch(
                      updateInstance({
                        ...exerciceValues.image,
                        trValue: createTranslatableContent(
                          lang,
                          generateAbsolutePath(file),
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
          <div className={leftGridCellStyle}>{exerciceId}</div>
          <div>Titre</div>
          <SimpleInput
            className={leftGridCellStyle}
            value={translate(exerciceValues.titre.trValue, lang)}
            onChange={value => {
              dispatch(
                updateInstance({
                  ...exerciceValues.titre,
                  trValue: createTranslatableContent(lang, String(value)),
                } as IVariableInstance),
              );
            }}
          />
          <div>Image</div>
          <div className={cx(leftGridCellStyle, portraitStyle)}>
            <img
              className={portraitImgStyle}
              src={fileURL(translate(exerciceValues.image.trValue, lang))}
            />
            <div className={portraitClickStyle}>
              <Button
                icon={{ icon: 'download', size: '5x' }}
                onClick={() => setBrowsingFile(true)}
              />
            </div>
          </div>
          <div>Description</div>
          <HTMLEditor
            className={leftGridCellStyle}
            value={translate(exerciceValues.description.trValue, lang)}
            onChange={value =>
              dispatch(
                updateInstance({
                  ...exerciceValues.description,
                  trValue: createTranslatableContent(lang, value),
                } as IVariableInstance),
              )
            }
          />
          <div>Actif</div>
          <Toggler
            value={exerciceValues.active.value}
            onChange={value =>
              dispatch(
                updateInstance({
                  ...exerciceValues.active,
                  value,
                } as IVariableInstance),
              )
            }
            className={leftGridCellStyle}
          />
          <div>Editer les exercices</div>
          <div className={exerciceEditionStyle}>
            {exercices != null && (
              <CTree variableId={exercices} nodeProps={() => ({})} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerExerciceEdition({
  onClickBack,
}: { onClickBack: OpenPageAction } & WegasComponentProps) {
  const player = instantiate(useStore(Player.selectCurrent));
  const exerciceId = useStore(() =>
    instantiate(
      VariableDescriptor.findByName<INumberDescriptor>('exerciceCourant'),
    )?.getValue(player),
  );

  const onClickBackAction = React.useCallback(() => {
    const name = clientScriptEval<string>(onClickBack.pageLoaderName.content);
    if (name != null) {
      store.dispatch(
        ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
          name,
          pageId: onClickBack.pageId,
        }),
      );
    }
  }, [onClickBack]);

  return (
    <ExerciceEdition
      exerciceId={exerciceId || 0}
      onClickBack={onClickBackAction}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerExerciceEdition,
    componentType: 'Other',
    name: 'PRITS Exercice edition',
    icon: 'pen',
    schema: {
      onClickBack: schemaProps.object({
        label: 'Open Page',
        required: true,
        properties: {
          pageLoaderName: schemaProps.pageLoaderSelect({
            label: 'Page loader',
            required: true,
          }),
          pageId: schemaProps.pageSelect({ label: 'Page', required: true }),
        },
      }),
    },
  }),
);
