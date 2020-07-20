type ITranslatableContent = import('wegas-ts-api/typings/WegasEntities').ITranslatableContent;

interface GlobalPopupClass {
  addPopup: (
    id: string,
    message: ITranslatableContent,
    duration?: number,
  ) => void;
  removePopup: (id: string) => void;
}
