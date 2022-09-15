# Page components

## Usage

1. Create a file that ends with `.component.tsx` (works anywhere in the project but it's better to put it in src/Components/PageComponents to keep the project tidy)
2. Create a component with props that extends `WegasComponentProps`.
3. Code it as the following example :

```typescript
interface ExampleProps extends WegasComponentProps {
  exampleProp1: SStringDescriptor;
  exampleProp2?: number;
}

function Example({
  exampleProp1,
  exampleProp2,
  className,
  style,
  id,
}: ExampleProps){
  return (
    <div className={className} style={style} id={id}>
      <ExampleComponent exampleProp1={exampleProp1} exampleProp2={exampleProp2}>
    </div>
  );
};
```

Then you must register the component with :

- the react component
- an id
- a name
- an icon
- the component type
- a schema that describes the component form

Register it as the following example :

```typescript
registerComponent(
  pageComponentFactory({
    component: Example, /* the page component */
    id: "Example" /* the component id */
    name: 'Example', /* the displayed name of the component */
    icon: 'ambulance', /* component icon page layout */
    schema: { /* schema describing the component in component properties form [see Information] */
      exampleProp1: schemaProps.scriptVariable('Variable', true, ['StringDescriptor']),
      exampleProp2: schemaProps.number('Number', false),
    },
  }),
);
```

Other registering attributes can bu used :

- behaviour : describes the behaviour of the component on delete, move and drop actions and which page component is allowed as child
- container :
  - isVertical : a function that customize the component orientation
  - ChildrenDeserilizer : a customized deserializer for the children
  - childrenAdditionalShema : A specific schema for the children
  - childrenLayoutOptionSchema : Additional options that the children have in this page component
  - childrenLayoutOptionSchema : A filter for picking only specific options of the schema
- dropZones : If the component can have children, indicates which drop zone to display when a component is dragged over
- illustration : the ilustration displayed in the component palette
- manageOnClick : will let the click management be done by the component
- obsoleteComponent :
  - keepDisplayingToPlayer : can this component still be created
  - isObsolete : a method that returns if the component is obsolete (either if the component is not to be used anymore or if its properties must be changed)
  - sanitizer : a method that will modify the json description of the component (can change the component or its properties)

## Infomation

- The `schemaProps` object has been created to ease the schema creation. Don't forget to specify the required argument especially if the prop is optional (required is true by default).
- For more info about the pageComponentFactory look at src/Components/PageComponents/componentFactory.tsx file and the defined interfaces in it.

## Important notice

- **Never export anything from a `*.component.tsx` file**, it will create circular references and an error saying that `registerComponent` is not defined will show.
- Never use cx to merge classNames given to a page component. The given className should always keep its value in order to match custom css classes given in the scenario's scripts. Use the `classOrNothing` function instead

```typescript
<div className={className + classOrNothing(<other classes>)}/>
```
