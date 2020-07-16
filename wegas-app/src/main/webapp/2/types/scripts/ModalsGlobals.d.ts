interface GlobalModalClass {
  addModal: (id: string, message: string, duration?: number) => void;
  removeGlobal: (id: string) => void;
}
