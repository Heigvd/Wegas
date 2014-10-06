/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.game.GameModel;
import com.wegas.mcq.persistence.QuestionDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@NamedQuery(name = "findListDescriptorByChildId",
        query = "SELECT DISTINCT listDescriptor FROM ListDescriptor listDescriptor LEFT JOIN listDescriptor.items AS item WHERE item.id = :itemId")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "QuestionDescriptor", value = QuestionDescriptor.class)
})
public class ListDescriptor extends VariableDescriptor<VariableInstance> implements DescriptorListI<VariableDescriptor> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ListDescriptor.class);
    /**
     *
     */
    @OneToMany(cascade = {CascadeType.ALL})
    //@BatchFetch(BatchFetchType.IN)
    @JoinColumn(referencedColumnName = "variabledescriptor_id")
    //@OrderBy("id")
    @OrderColumn
    private List<VariableDescriptor> items = new ArrayList<>();

    /**
     *
     */
    public ListDescriptor() {
        super();
    }

    /**
     *
     * @param name
     */
    public ListDescriptor(String name) {
        super(name);
    }

    /**
     *
     * @param name
     * @param defaultInstance
     */
    public ListDescriptor(String name, VariableInstance defaultInstance) {
        super(name, defaultInstance);
    }

    /*  @Override
     public Boolean contains(String criteria) {
     if (super.contains(criteria)) {
     return true;
     } else {
     for (VariableDescriptor d : this.getItems()) {
     if (d.contains(criteria)) {
     return true;
     }
     }
     }
     return false;
     }*/
    /**
     *
     * @param gameModel
     */
    @Override
    public void setGameModel(GameModel gameModel) {
        super.setGameModel(gameModel);
        for (VariableDescriptor item : this.items) {
            item.setGameModel(gameModel);
        }
    }

    /**
     * @return the variableDescriptors
     */
    @Override
    public List<VariableDescriptor> getItems() {
        return items;
    }

    /**
     * @param items
     */
    @Override
    public void setItems(List<VariableDescriptor> items) {
        this.items = items;
    }

    /**
     *
     * @param item
     */
    @Override
    public void addItem(VariableDescriptor item) {
        this.items.add(item);
        item.setGameModel(this.getGameModel());
    }

    @Override
    public void addItem(int index, VariableDescriptor item) {
        this.items.add(index, item);
        item.setGameModel(this.getGameModel());
    }

    /**
     *
     * @param index
     * @return
     */
    @Override
    public VariableDescriptor item(int index) {
        return this.items.get(index);
    }

    /**
     *
     * @return
     */
    @Override
    public int size() {
        return this.items.size();
    }

    /**
     *
     * @param item
     * @return
     */
    @Override
    public boolean remove(VariableDescriptor item) {
        return this.items.remove(item);
    }
}
