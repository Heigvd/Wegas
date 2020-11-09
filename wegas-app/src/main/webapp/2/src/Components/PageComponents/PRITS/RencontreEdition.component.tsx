import { cx, css } from 'emotion';
import * as React from 'react';
import {
  IBooleanInstance,
  IListDescriptor,
  INumberDescriptor,
  IStringInstance,
  ITextInstance,
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
import { mainLayoutId } from '../../../Editor/Components/Layout';
import { focusTab } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { getEntityActions } from '../../../Editor/editionConfig';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { clientScriptEval } from '../../Hooks/useScript';
import HTMLEditor from '../../HTMLEditor';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { Button } from '../../Inputs/Buttons/Button';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { Modal } from '../../Modal';
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

interface RencontreEditionProps {
  rencontreId: number;
  onClickBack: () => void;
}

const dispatch = store.dispatch;

function RencontreEdition({ rencontreId, onClickBack }: RencontreEditionProps) {
  const [browsingFile, setBrowsingFile] = React.useState<boolean>(false);
  const { lang } = React.useContext(languagesCTX);
  const player = instantiate(useStore(Player.selectCurrent));

  const rencontreValues = useStore(() => {
    const rencontre = instantiate(
      VariableDescriptor.select<IListDescriptor>(rencontreId),
    );

    if (!rencontre) {
      return undefined;
    }

    const titre = rencontre
      ?.getItems()
      .find(item => item.getEditorTag() === 'titre')
      ?.getInstance(player)
      ?.getEntity() as IStringInstance;
    const description = rencontre
      ?.getItems()
      .find(item => item.getEditorTag() === 'description')
      ?.getInstance(player)
      ?.getEntity() as ITextInstance;
    const image = rencontre
      ?.getItems()
      .find(item => item.getEditorTag() === 'image')
      ?.getInstance(player)
      ?.getEntity() as ITextInstance;
    const dialogue = rencontre
      ?.getItems()
      .find(item => item.getEditorTag() === 'dialogue')
      ?.getEntity();
    const active = rencontre
      ?.getItems()
      .find(item => item.getEditorTag() === 'active')
      ?.getInstance(player)
      ?.getEntity() as IBooleanInstance;

    return { titre, description, image, dialogue, active };
  }, deepDifferent);

  const dialogue = rencontreValues?.dialogue;

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
        <h2 className={cx(grow, textCenter)}>Rencontre</h2>
      </div>

      {!rencontreValues ? (
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
                        ...rencontreValues.image,
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
          <div className={leftGridCellStyle}>{rencontreId}</div>
          <div>Titre</div>
          <SimpleInput
            className={leftGridCellStyle}
            value={translate(rencontreValues.titre.trValue, lang)}
            onChange={value => {
              dispatch(
                updateInstance({
                  ...rencontreValues.titre,
                  trValue: createTranslatableContent(lang, String(value)),
                } as IVariableInstance),
              );
            }}
          />
          <div>Image</div>
          <div className={cx(leftGridCellStyle, portraitStyle)}>
            <img
              className={portraitImgStyle}
              src={fileURL(translate(rencontreValues.image.trValue, lang))}
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
            value={translate(rencontreValues.description.trValue, lang)}
            onChange={value =>
              dispatch(
                updateInstance({
                  ...rencontreValues.description,
                  trValue: createTranslatableContent(lang, value),
                } as IVariableInstance),
              )
            }
          />
          <div>Actif</div>
          <Toggler
            value={rencontreValues.active.value}
            onChange={value =>
              dispatch(
                updateInstance({
                  ...rencontreValues.active,
                  value,
                } as IVariableInstance),
              )
            }
            className={leftGridCellStyle}
          />
          <div>Editer dialogue</div>
          {dialogue != null && (
            <Button
              // label="Editer dialogue"
              icon="pen"
              onClick={() => {
                getEntityActions(dialogue).then(({ edit }) =>
                  dispatch(edit(dialogue)),
                );
                focusTab(mainLayoutId, 'State Machine');
              }}
              className={leftGridCellStyle}
            />
          )}
        </div>
      )}
    </div>
  );
}

function PlayerRencontreEdition({
  onClickBack,
}: { onClickBack: OpenPageAction } & WegasComponentProps) {
  const player = instantiate(useStore(Player.selectCurrent));
  const rencontreId = useStore(() =>
    instantiate(
      VariableDescriptor.findByName<INumberDescriptor>('rencontreCourante'),
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
    <RencontreEdition
      rencontreId={rencontreId || 0}
      onClickBack={onClickBackAction}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerRencontreEdition,
    componentType: 'Other',
    name: 'PRITS Rencontre edition',
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
