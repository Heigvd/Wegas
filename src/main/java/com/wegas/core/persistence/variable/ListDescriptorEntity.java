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

import com.wegas.mcq.persistence.QuestionDescriptorEntity;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "ListDescriptor")
@NamedQuery(name = "findListDescriptorByChildId",
query = "SELECT DISTINCT listDescriptor FROM ListDescriptorEntity listDescriptor LEFT JOIN listDescriptor.items AS item WHERE item.id = :itemId")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "QuestionDescriptor", value = QuestionDescriptorEntity.class)
})
public class ListDescriptorEntity extends VariableDescriptorEntity<VariableInstanceEntity> {

    private static final long serialVersionUID = 1L;
    @Transient
    private final Logger logger = LoggerFactory.getLogger(ListDescriptorEntity.class);
    /**
     * @fixme if we use a joint table here, it does not do the cascading on
     * delete a child for the joint table. @JoinTable(joinColumns = {
     * @JoinColumn(referencedColumnName = "variabledescriptor_id")},
     * inverseJoinColumns = { @JoinColumn(referencedColumnName =
     * "variabledescriptor_id")})
     */
    @OneToMany(cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(referencedColumnName = "variabledescriptor_id")
    private List<VariableDescriptorEntity> items;

    /**
     * @return the variableDescriptors
     */
    public List<VariableDescriptorEntity> getItems() {
        return items;
    }

    /**
     * @param variableDescriptors the variableDescriptors to set
     */
    public void setItems(List<VariableDescriptorEntity> items) {
        this.items = items;
    }

    @PrePersist
    public void prePersist() {
        for (VariableDescriptorEntity item : this.items) {
            item.setRootGameModel(this.getGameModel());
        }
    }

    /**
     *
     * @param vd
     */
    @XmlTransient
    public void addItem(VariableDescriptorEntity item) {
        this.items.add(item);
        item.setGameModel(this.getGameModel());
    }
}
