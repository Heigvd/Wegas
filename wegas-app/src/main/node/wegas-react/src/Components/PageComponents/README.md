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
  EditHandle,
}: ExampleProps){
  return (
    <>
      <EditHandle />
      <ExampleComponent exampleProp1={exampleProp1} exampleProp2={exampleProp2}>
    </>
  );
};
```

3. Finaly you must register the component with :
   - a type name
   - an icon
   - a schema
   - the Wegas entities that can be used with the component (in case you drag and drop entity on the page)
   - the component default props when created from an entity
4. Code it as the following example :

```typescript
registerComponent(
  pageComponentFactory({
    component: Example, /* the page component */
    componentType: 'Other',  /* component section => 'Other' | 'Layout' | 'Input' | 'Output' | 'Advanced' | 'Programmatic' */
    name: 'Example', /* the name of the component */
    icon: 'ambulance', /* component icon in palette */
    container: {...}, /* if your component can contain children */
    schema: { /* schema describing the component in component properties form [see Information] */
      exampleProp1: schemaProps.scriptVariable('Variable', true, ['StringDescriptor']),
      exampleProp2: schemaProps.number('Number', false),
    },
    allowedVariables : ['SStringDescriptor'], /* allowed entities for component creation */
    getComputedPropsFromVariable: (sd: SStringDescriptor) => ({ /* computed component props from allowedVariables */
      exampleProp1: sd,
      exampleProp2: 10,
    }),
    obsoleteComponent: {...}, /* use this parameter if your component is obsolete and need changes [see Information]*/
  }),
);
```

## Infomation

- The `schemaProps` object has been created to ease the schema creation. Don't forget to specify the required argument especially if the prop is optional (required is true by default).
- `obsoleteComponent` object allows to modify an obsolet component. It contains the following attributes :
  - `keepDisplayingToPlayer` : a boolean that tells if the obsolete component should still be displayed to the player.
  - `isObsolete` : a function that tells the system if the component is obsolete.
  - `sanitizer` : a function that takes the old component and return a non obsolete new one.
- For more info about the pageComponentFactory look at src/Components/PageComponents/componentFactory.tsx file and the defined interfaces in it.

## Important notice

- Do never export components from a `*.component.tsx` file, it will create circular references and an error saying that `registerComponent` is not defined will show.
- Never use cx to merge classNames given to a page component. The given className should always keep its value in order to match custom css classes given in the scenario's scripts.
