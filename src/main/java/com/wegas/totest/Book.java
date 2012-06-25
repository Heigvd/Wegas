package com.wegas.totest;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
public class Book extends AbstractEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @Override
    public Long getId() {
        return this.id;
    }


    @Override
    public void merge(AbstractEntity a) {
        this.title = ((Book)a).getTitle();
    }
}
