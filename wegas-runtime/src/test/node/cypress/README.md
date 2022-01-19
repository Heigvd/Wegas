# Writing Cypress Test

Tests report will be included in maven site.
To have consistent naming, please follow this template


```typescript
describe("ch.colabproject.colab.tests.e2e.<SuiteName>", () => {

  beforeEach(() => {
    cy.visitWegas();
    cy.waitForReact();
  });

  it("TestName", () => {
    cy.react().do().stuff();
  });

  it("AnotherTestName", () => {
    cy.react().do().stuff();
  })

  and so on
});

```