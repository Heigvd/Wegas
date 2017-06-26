/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.*;

/**
 * @author Maxence
 */
@Entity
@Table(name = "MCQReplies", indexes = {
    @Index(columnList = "result_id")
})
public class Replies extends AbstractEntity  {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;

    @OneToOne(optional = false)
    private Result result;

    @OneToMany(mappedBy = "replies", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Reply> replies = new ArrayList<>();


    @Override
    public Long getId() {
        return id;
    }

    public void add(Reply reply){
        replies.add(reply);
    }

    public Result getResult() {
        return result;
    }

    public void setResult(Result result) {
        this.result = result;
    }

    public void remove(Reply reply){
        replies.remove(reply);
    }

    @Override
    public void merge(AbstractEntity other) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }
}
