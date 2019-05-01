interface IFile {
  bytes: number;
  description: string;
  directory: boolean;
  mimeType: string;
  name: string;
  note: string;
  path: string;
  refId: string;
  visibility: IVisibility;
}

type IFileMap = { [key: string]: IFile };
