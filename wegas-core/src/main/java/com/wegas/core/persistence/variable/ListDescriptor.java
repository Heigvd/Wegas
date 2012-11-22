/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.Helper;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.mcq.persistence.QuestionDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
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
public class ListDescriptor extends VariableDescriptor<VariableInstance> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ListDescriptor.class);
    /**
     * @fixme if we use a joint table here, it does not do the cascading on
     * delete a child for the joint table. @JoinTable(joinColumns = {
     * @JoinColumn(referencedColumnName = "variabledescriptor_id")},
     * inverseJoinColumns = { @JoinColumn(referencedColumnName =
     * "variabledescriptor_id")})
     */
    @OneToMany(cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(referencedColumnName = "variabledescriptor_id")
    @OrderBy("id")
    private List<VariableDescriptor> items = new ArrayList<VariableDescriptor>();

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
    public List<VariableDescriptor> getItems() {
        return items;
    }

    /**
     * @param items
     */
    public void setItems(List<VariableDescriptor> items) {
        this.items = items;
    }

    /**
     *
     * @param item
     */
    @XmlTransient
    public void addItem(VariableDescriptor item) {
        this.items.add(item);
        if((item.getEditorLabel() == null || item.getEditorLabel().isEmpty()) && item.getLabel() != null){
            item.setEditorLabel(item.getLabel());
        }
        item.setGameModel(this.getGameModel());
    }

    public VariableDescriptor item(int index) {
        return this.items.get(index);
    }
}
