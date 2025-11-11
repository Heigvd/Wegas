interface GlobalClassesClass {
  addClass: (className: string, label: string) => void;
  removeClass: (className: string) => void;
  classes: Readonly<Record<string, string>>
}
