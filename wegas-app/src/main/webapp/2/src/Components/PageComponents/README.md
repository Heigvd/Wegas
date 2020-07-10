# Page components

## Usage

1. Create a file that ends with `.component.tsx` (anywhere in the project)
2. Create a component with props that extends `PageComponentMandatoryProps`. This extended interface gives you a handle for edition (you must add it to your component in order to edit the component and the page).
3. Code it as the following example :

```typescript
interface ExampleProps extends PageComponentMandatoryProps {
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
  pageComponentFactory(
    /* your component */ Example,
    /* component type */ 'Example',
    /* component icon in palette */ 'ambulance',
    /* schema in component edition form */
    {
      exampleProp1: schemaProps.scriptVariable('Variable', true, [
        'StringDescriptor',
      ]),
      exampleProp2: schemaProps.number('Number', false),
    },
    /* allowed entities for component creation */
    ['SStringDescriptor'],
    /* default component props with entity */
    (sd: SStringDescriptor) => ({
      exampleProp1: sd,
      exampleProp2: 10,
    }),
  ),
);
```

5. The `schemaProps` object has been created to ease the schema creation. Don't forget to specify the required argument especially if the prop is optional (required is true by default)

## Important notice

Do never export components from a `*.component.tsx` file, it will create circular references and an error saying that `registerComponent` is not defined will show.
