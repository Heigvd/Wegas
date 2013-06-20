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
    private List<VariableDescriptor> items = new ArrayList<VariableDescriptor>();

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
     * @param force
     */
    /*
     * @Override public void propagateDefaultInstance(boolean force) {
     * super.propagateDefaultInstance(force); for (VariableDescriptor vd:
     * this.getItems()) { vd.propagateDefaultInstance(force); } }
     */
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
//    @Override
//    public void setItems(List<VariableDescriptor> items) {
//        this.items = items;
//    }
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
        if ((item.getEditorLabel() == null || item.getEditorLabel().isEmpty()) && item.getLabel() != null) {
            item.setEditorLabel(item.getLabel());
        }
        item.setGameModel(this.getGameModel());
    }

    @Override
    public void addItem(int index, VariableDescriptor vd) {
        this.items.add(index, vd);
        vd.setGameModel(this.getGameModel());
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

    @Override
    public int size() {
        return this.items.size();
   }

    @Override
    public boolean remove(VariableDescriptor item) {
        return this.items.remove(item);
    }
}
