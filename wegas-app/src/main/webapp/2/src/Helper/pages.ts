import { Item } from '../Editor/Components/Tree/TreeSelect';
import { css } from 'emotion';
import { themeVar } from '../Components/Theme';

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
      ? css({ color: themeVar.primaryDarkerColor })
      : undefined,
  );
}
