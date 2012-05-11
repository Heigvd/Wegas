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

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.primitive.NumberDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.StringDescriptorEntity;
import com.wegas.core.persistence.variable.scope.AbstractScopeEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptorEntity;
import com.wegas.mcq.persistence.ChoiceDescriptorEntity;
import com.wegas.mcq.persistence.QuestionDescriptorEntity;
import com.wegas.messaging.persistence.variable.InboxDescriptorEntity;
import java.util.List;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @param <T>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
//@EntityListeners({GmVariableDescriptorListener.class})
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"variabledescriptors_gamemodelid", "name"}))
@NamedQuery(name = "findVariableDescriptorsByRootGameModelId", query = "SELECT DISTINCT variableDescriptor FROM VariableDescriptorEntity variableDescriptor LEFT JOIN variableDescriptor.gameModel AS gm WHERE gm.id = :gameModelId")
@XmlType(name = "VariableDescriptor")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StringDescriptor", value = StringDescriptorEntity.class),
    @JsonSubTypes.Type(name = "ListDescriptor", value = ListDescriptorEntity.class),
    @JsonSubTypes.Type(name = "MCQDescriptor", value = QuestionDescriptorEntity.class),
    @JsonSubTypes.Type(name = "NumberDescriptor", value = NumberDescriptorEntity.class),
    @JsonSubTypes.Type(name = "InboxDescriptor", value = InboxDescriptorEntity.class),
    @JsonSubTypes.Type(name = "FSMDescriptor", value = StateMachineDescriptorEntity.class),
    @JsonSubTypes.Type(name = "ChoiceDescriptor", value = ChoiceDescriptorEntity.class)
})
public class VariableDescriptorEntity<T extends VariableInstanceEntity> extends NamedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @Column(name = "variabledescriptor_id")
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @NotNull
    private String name;
    /**
     *
     */
    @ManyToOne
    @JoinColumn
    //@JsonBackReference
    @XmlTransient
    private GameModelEntity gameModel;
    /**
     * Here we cannot use type T, otherwise jpa won't handle the db ref
     * correctly
     */
    @OneToOne(cascade = {CascadeType.ALL})
    @NotNull
    private VariableInstanceEntity defaultVariableInstance;
    /*
     * @OneToOne(cascade = CascadeType.ALL) @NotNull @JoinColumn(name
     * ="SCOPE_ID", unique = true, nullable = false, insertable = true,
     * updatable = true)
     */
    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval=true)
    @NotNull
    //@JsonManagedReference
    private AbstractScopeEntity scope;
    /**
     *
     */
    @ManyToMany(cascade = {CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REFRESH})
    @JoinTable(joinColumns = {
        @JoinColumn(referencedColumnName = "variabledescriptor_id")},
    inverseJoinColumns = {
        @JoinColumn(referencedColumnName = "tag_id")})
    private List<Tag> tags;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        VariableDescriptorEntity vd = (VariableDescriptorEntity) a;
        this.scope.merge(vd.getScope());
        this.defaultVariableInstance.merge(vd.getDefaultVariableInstance());
    }

    /**
     *
     * @param force
     */
    public void propagateDefaultInstance(boolean force) {
        this.getScope().propagateDefaultInstance(force);
    }

    /**
     *
     * @param player
     * @return
     */
    public T getVariableInstance(PlayerEntity player) {
        return (T) this.scope.getVariableInstance(player);
    }

    /**
     *
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @param id
     */
    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     *
     * @return
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @param gameModel
     */
    public void setGameModel(GameModelEntity gameModel) {
        this.gameModel = gameModel;
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public GameModelEntity getGameModel() {
        return this.gameModel;
    }

    /**
     * @return the scope
     */
    public AbstractScopeEntity getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set @fixme here we cannot use managed
     * references since this.class is abstract.
     */
    //@JsonManagedReference
    public void setScope(AbstractScopeEntity scope) {
        this.scope = scope;
        scope.setVariableDescscriptor(this);
    }

    /**
     * @return the defaultVariableInstance
     */
    public VariableInstanceEntity getDefaultVariableInstance() {
        return defaultVariableInstance;
    }

    /**
     * @param defaultVariableInstance the defaultValue to set
     */
    public void setDefaultVariableInstance(T defaultVariableInstance) {
        this.defaultVariableInstance = defaultVariableInstance;
    }

    /**
     * @return the tags
     */
    public List<Tag> getTags() {
        return tags;
    }

    /**
     * @param tags the tags to set
     */
    public void setTags(List<Tag> tags) {
        this.tags = tags;
    }
}
