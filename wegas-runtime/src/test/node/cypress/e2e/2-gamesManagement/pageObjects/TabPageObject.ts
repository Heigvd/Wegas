export abstract class TabPageObject {
  search: string = "input[placeholder='search...']";

  open() : void {
    cy.gotoPage(this.name);
  }

  setSearchTerm(searchTerm) : void {
    cy.get(this.search).clear().type(searchTerm);
  }

  createEmptyModel() : void {
    cy.createEmptyModel();
    cy.gotoPage(this.name);
  }
}