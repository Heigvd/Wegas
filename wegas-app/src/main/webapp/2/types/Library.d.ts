interface ILibrary {
  refId?: string;
  id?: number;
  contentType?: string;
  content: string;
  visibility: IVisibility;
  version?: number;
}

interface ILibraries {
  [id: string]: ILibrary;
}
