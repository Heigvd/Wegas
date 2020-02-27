type PageIndexItem = PageIndexFolder | PageIndexPage;

interface PageIndexFolder {
  '@class': 'Folder',
  name: string;
  items: PageIndexItem[];
}

interface PageIndexPage {
    '@class': 'Page',
    id?: string;
    name: string;
    trainerPage?: boolean
    scenaristPage?: boolean
}

interface PageIndex {
  root: PageIndexFolder;
  defaultPageId: string;
}

interface WegasComponent {
  type: string;
  props: {
    children?: WegasComponent[];
    [prop: string]: any;
  };
}
interface Pages {
  [id: string]: WegasComponent;
}
