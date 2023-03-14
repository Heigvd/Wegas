import { isEqual } from 'lodash';
import * as React from 'react';
import { ActionCreator } from '../../../data/actions';
import { entityIs } from '../../../data/entities';
import { State } from '../../../data/Reducer/reducers';
import { store, useStore } from '../../../data/Stores/store';
import {
  defaultPageCTX,
  pageCTX,
} from '../../../Editor/Components/Page/PageEditor';
import { PageLoader } from '../../../Editor/Components/Page/PageLoader';
import {
  PageLoaderComponentProps,
  PAGE_LOADER_COMPONENT_TYPE,
} from '../../../Helper/pages';
import { createScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerPageLoaderProps
  extends WegasComponentProps,
    Omit<PageLoaderComponentProps, 'initialSelectedPageId'> {
  initialSelectedPageId: string | IScript;
  exposePageSizeAs?: string;
}

const defaultPageAsScript = () =>
  createScript(
    JSON.stringify(store.getState().pages.index.defaultPageId),
    'TypeScript',
  );

function PlayerPageLoader({
  initialSelectedPageId,
  name,
  context = {},
  className,
  style,
  id,
  loadTimer,
  options,
  exposePageSizeAs,
}: PlayerPageLoaderProps) {
  const { pageIdPath } = React.useContext(pageCTX);

  const pageScriptSelector = React.useCallback(
    (s: State) => {
      if (name != null) {
        return s.global.pageLoaders[name];
      }
    },
    [name],
  );
  let pageScript = useStore(pageScriptSelector);

  const initialSelectedPageIdScript = entityIs(initialSelectedPageId, 'Script')
    ? initialSelectedPageId
    : createScript(JSON.stringify(initialSelectedPageId), 'TypeScript');

  const initialSelectedPageIdScriptRef = React.useRef(
    initialSelectedPageIdScript,
  );

  if (
    name != null &&
    (!pageScript ||
      !isEqual(
        initialSelectedPageIdScript,
        initialSelectedPageIdScriptRef.current,
      ))
  ) {
    initialSelectedPageIdScriptRef.current = initialSelectedPageIdScript;
    pageScript = initialSelectedPageIdScript;
  }

  React.useEffect(() => {
    if (
      name != null &&
      (!pageScript ||
        !isEqual(
          initialSelectedPageIdScript,
          initialSelectedPageIdScriptRef.current,
        ))
    ) {
      store.dispatch(
        ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
          name,
          pageId: initialSelectedPageIdScript,
        }),
      );
    }
  }, [name, pageScript, initialSelectedPageIdScript]);

  const pageId = useScript<string | undefined>(pageScript, context) || '';

  return pageIdPath.includes(pageId) ? (
    <pre className={className} style={style} id={id}>
      Page {pageId} recursion
    </pre>
  ) : (
    <pageCTX.Provider
      value={{
        ...defaultPageCTX,
        pageIdPath: [...pageIdPath, pageId],
      }}
    >
      <PageLoader
        className={className}
        style={style}
        id={id}
        selectedPageId={pageId}
        loadTimer={loadTimer}
        context={context}
        disabled={options.disabled}
        readOnly={options.readOnly}
        exposeSizeAs={exposePageSizeAs}
      />
    </pageCTX.Provider>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerPageLoader,
    componentType: 'Layout',
    id: PAGE_LOADER_COMPONENT_TYPE,
    name: 'Page loader',
    icon: 'window-maximize',
    illustration: 'pageLoader',
    schema: {
      initialSelectedPageId: {
        type: ['object', 'string'],
        view: {
          type: 'scriptable',
          label: 'Choices',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['string'],
          },
          literalSchema: schemaProps.pageSelect({ label: 'Page' }),
        },
      },
      exposePageSizeAs: {
        value: '',
        view: {
          type: 'string',
          label: 'expose page size in Context as',
        },
      },
      loadTimer: schemaProps.number({ label: 'Loading timer (ms)' }),
      ...classStyleIdSchema,
    },
    getComputedPropsFromVariable: () => ({
      initialSelectedPageId: defaultPageAsScript(),
    }),
  }),
);
