import { cx, css } from 'emotion';
import * as React from 'react';
import {
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
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { clientScriptEval } from '../../Hooks/useScript';
import HTMLEditor from '../../HTMLEditor';
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
  position: 'absolute',
  display: 'flex',
  top: 0,
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
});

interface PatientEditionProps {
  patientId: number;
  onClickBack: () => void;
}

const dispatch = store.dispatch;

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
    </div>
  );
}

function PlayerPatientEdition({
  onClickBack,
}: { onClickBack: OpenPageAction } & WegasComponentProps) {
  const player = instantiate(useStore(Player.selectCurrent));

  const patientId = useStore(() =>
    instantiate(
      VariableDescriptor.findByName<INumberDescriptor>('currentPatient'),
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
    <PatientEdition
      patientId={patientId || 0}
      onClickBack={onClickBackAction}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerPatientEdition,
    componentType: 'Other',
    name: 'PRITS Patient edition',
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
