type PageIndexItem = PageIndexFolder | PageIndexPage;

interface PageIndexFolder {
  '@class': 'Folder';
  name: string;
  items: PageIndexItem[];
}

interface PageIndexPage {
  '@class': 'Page';
  id?: string;
  name: string;
  trainerPage?: boolean;
  scenaristPage?: boolean;
}

interface PageIndex {
  root: PageIndexFolder;
  defaultPageId: string;
}

interface WegasComponent {
  type: string;
  undeletable?: boolean;
  props: {
    children?: WegasComponent[];
    [prop: string]: any;
  };
}

interface Pages {
  [id: string]: WegasComponent;
}

interface PageWithName {
  name: string;
  page: WegasComponent;
}

interface PagesWithName {
  [id: string]: PageWithName;
}

type AllPages = Pages & {
  index: PageIndex;
};
