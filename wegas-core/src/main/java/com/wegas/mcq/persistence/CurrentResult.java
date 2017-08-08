/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
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
@Table(name = "MCQCurrentResult", indexes = {
    @Index(columnList = "result_id")
})
public class CurrentResult extends AbstractEntity  {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;

    @OneToOne(optional = false)
    private Result result;

    @OneToMany(mappedBy = "currentResult", cascade = CascadeType.MERGE)
    private List<ChoiceInstance> choiceInstances = new ArrayList<>();

    public List<ChoiceInstance> getChoiceInstances() {
        return choiceInstances;
    }

    public void setChoiceInstances(List<ChoiceInstance> choiceInstances) {
        this.choiceInstances = choiceInstances;
    }

    @Override
    public Long getId() {
        return id;
    }

    public void add(ChoiceInstance choiceInstance){
        choiceInstances.add(choiceInstance);
    }

    public Result getResult() {
        return result;
    }

    public void setResult(Result result) {
        this.result = result;
    }

    public boolean remove(ChoiceInstance choiceInstance){
        return choiceInstances.remove(choiceInstance);
    }

    @Override
    public void __merge(AbstractEntity other) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }
}
