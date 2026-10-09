import { isEqual } from 'lodash';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { useAppSelector } from '../../../store/hooks';
import { selectDefaultPageId } from '../../../store/slices/pages';
import {
  pageLoaderRegistered,
  selectPageLoaders,
} from '../../../store/slices/scriptRegistry';
import { dispatch, store } from '../../../store/store';
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
    JSON.stringify(selectDefaultPageId(store.getState()) ?? ''),
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

  let pageScript = useAppSelector(s =>
    name != null ? selectPageLoaders(s)[name] : undefined,
  );

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
      dispatch(
        pageLoaderRegistered({
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
          label: 'Initial page',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['string'],
          },
          literalSchema: schemaProps.pageSelect({ }),
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
