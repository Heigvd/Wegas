export class TrainerPageObject {

  search: string = "input[placeholder='search...']";
  //search: string ="DebouncedInput";

  open() : TrainerPageObject {
    cy.gotoPage('trainer');
    return this;
  }

  setSearchTerm(searchTerm) : TrainerPageObject{
    cy.get (this.search).type(searchTerm);
    //cy.react(this.search).type(searchTerm);

    return this;
  }

}