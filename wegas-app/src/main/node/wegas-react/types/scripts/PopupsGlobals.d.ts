interface GlobalPopupClass {
  addPopup: (
    id: string,
    message: ITranslatableContent,
    duration?: number,
    className?: string,
  ) => void;
  removePopup: (id: string) => void;
}
