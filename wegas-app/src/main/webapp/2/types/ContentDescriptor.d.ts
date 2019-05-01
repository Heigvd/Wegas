interface IFile {
  bytes: number;
  description: string;
  mimeType: string;
  name: string;
  note: string;
  path: string;
  refId: string;
  visibility: IVisibility;
}

interface IFileConfig extends IFile {
  '@class': 'File';
}

type IFileMap = { [key: string]: IFile };
