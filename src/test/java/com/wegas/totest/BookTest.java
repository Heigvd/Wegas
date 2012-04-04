package com.wegas.totest;

import com.wegas.core.persistence.AbstractEntityTest;


/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class BookTest extends AbstractEntityTest<Book> {

    public BookTest() {
        super(Book.class);
    }

    @Override
    public void merge() {
        Book book = new Book();
        book.setTitle("Test Title");
        tx.begin();
        this.getEm().persist(book);
        tx.commit();
        Long id = book.getId();
        Book secondBook = new Book();
        secondBook.setTitle("Second Test Title");
        book.merge(secondBook);
        tx.begin();
        this.getEm().merge(book);
        tx.commit();
        Book mergedBook = this.getEm().find(Book.class, id);

        assert secondBook.getTitle().equals(mergedBook.getTitle());
    }
}
