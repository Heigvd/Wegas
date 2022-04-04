import { css } from '@emotion/css';
import { cloneDeep } from 'lodash-es';
import { IScript } from 'wegas-ts-api';
import { themeVar } from '../Components/Theme/ThemeVars';

export function isPageItem(
  pageItemIndex?: PageIndexItem,
): pageItemIndex is PageIndexPage {
  return pageItemIndex != null && pageItemIndex['@class'] === 'Page';
}
export function isFolderItem(
  pageItemIndex?: PageIndexItem,
): pageItemIndex is PageIndexFolder {
  return pageItemIndex != null && pageItemIndex['@class'] === 'Folder';
}

export function isPageIndex(
  page?: PageIndex | WegasComponent,
): page is PageIndex {
  return (
    page != null &&
    'root' in page &&
    isFolderItem(page.root) &&
    'defaultPageId' in page &&
    typeof page.defaultPageId === 'string'
  );
}

export function visitIndex<T>(
  item: PageIndexItem,
  visitorFN: (item: PageIndexPage) => T,
): T[] {
  if (isFolderItem(item)) {
    return item.items.reduce((o, i) => [...o, ...visitIndex(i, visitorFN)], []);
  } else {
    return [visitorFN(item)];
  }
}

export function isWegasComponent(
  page?: PageIndex | WegasComponent,
): page is WegasComponent {
  return (
    page != null &&
    'type' in page &&
    typeof page.type === 'string' &&
    'props' in page &&
    typeof page.props === 'object'
  );
}

export function getItemFromPath(
  index: PageIndex,
  path: string[],
): PageIndexItem | undefined {
  const newPath = [...path];
  let folder: PageIndexItem | undefined = index.root;
  while (newPath.length > 0) {
    if (isFolderItem(folder)) {
      const itemPath = newPath.shift();
      folder = folder.items.find(i => i.name === itemPath);
      if (folder == null) {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
  return folder;
}

export function getPageIndexItemFromFolder(
  folder: PageIndexFolder,
  id?: string,
): PageIndexPage | undefined {
  if (id == null) {
    return undefined;
  } else {
    for (const item of folder.items) {
      if (isPageItem(item) && item.id === id) {
        return item;
      } else if (isFolderItem(item)) {
        const pageItem = getPageIndexItemFromFolder(item, id);
        if (pageItem != null) {
          return pageItem;
        }
      }
    }
  }
}

export function getPageIndexItem(
  index: PageIndex,
  id: string,
): PageIndexPage | undefined {
  return getPageIndexItemFromFolder(index.root, id);
}

export function pageItemsToTreeItem(
  pageItems: PageIndexItem[],
  itemClassName?: (item: PageIndexItem) => string | undefined,
): Item<PageIndexItem>[] {
  return pageItems.map(i => ({
    label: i.name,
    selectable: isPageItem(i),
    value: i,
    items: isFolderItem(i)
      ? pageItemsToTreeItem(i.items, itemClassName)
      : undefined,
    className: itemClassName && itemClassName(i),
  }));
}

export function indexToTree(index: PageIndex): Item<PageIndexItem>[] {
  return pageItemsToTreeItem(index.root.items, item =>
    isPageItem(item) && item.id === index.defaultPageId
      ? css({ color: themeVar.colors.SuccessColor })
      : undefined,
  );
}

export function visitComponents(
  component: WegasComponent,
  callbackFN: (component: WegasComponent) => void,
): void {
  callbackFN(component);
  const children = component.props?.children;
  if (children) {
    for (const child of children) {
      if (child) {
        visitComponents(child, callbackFN);
      }
    }
  }
}

export const findComponent = (
  page: WegasComponent,
  path: number[],
): {
  newPage: WegasComponent;
  component?: WegasComponent;
  parent?: WegasComponent;
} => {
  const browsePath = [...path];
  const newPage = cloneDeep(page);
  let parent: WegasComponent | undefined = undefined;
  let component: WegasComponent | undefined = newPage;
  while (browsePath.length > 0) {
    if (component?.props.children) {
      parent = component;
      component = component.props.children[browsePath[0]];
      browsePath.splice(0, 1);
    } else {
      return { newPage };
    }
  }
  return { newPage, component, parent };
};

export const PAGE_LOADER_COMPONENT_TYPE = 'PageLoader';

export interface PageLoaderComponentProps {
  name?: string;
  initialSelectedPageId: IScript;
  loadTimer?: number;
}

export type PageLoaderComponent = WegasComponent & {
  props: WegasComponent['props'] & PageLoaderComponentProps;
};

export function isPageLoaderComponent(
  component?: WegasComponent,
): component is PageLoaderComponent {
  return component != null && component.type === PAGE_LOADER_COMPONENT_TYPE;
}
