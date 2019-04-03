interface WegasComponent {
  type: string;
  props: {
    children?: WegasComponent[];
    [prop: string]: any;
  };
}
interface Page extends WegasComponent {
  '@name': string | null | undefined;
  '@index': number;
}
interface Pages {
  [id: string]: Page;
}
