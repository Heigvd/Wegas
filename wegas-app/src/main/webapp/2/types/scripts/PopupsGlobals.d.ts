type ITranslatableContent = import('wegas-ts-api').ITranslatableContent;

interface GlobalPopupClass {
  addPopup: (
    id: string,
    message: ITranslatableContent,
    duration?: number,
  ) => void;
  removePopup: (id: string) => void;
}
