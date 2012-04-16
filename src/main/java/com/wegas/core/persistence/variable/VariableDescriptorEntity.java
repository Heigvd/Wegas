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

import com.wegas.crimesim.persistence.variable.MCQDescriptorEntity;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.NamedEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.messaging.persistence.variable.InboxDescriptorEntity;
import com.wegas.core.persistence.variable.scope.ScopeEntity;
import com.wegas.core.persistence.variable.primitive.ListDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.NumberDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.StringDescriptorEntity;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonManagedReference;
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
@UniqueConstraint(columnNames = {"gamemodel_id", "name", "scope_id"}))
@XmlType(name = "VariableDescriptor", propOrder = {"@class", "id", "name", "scope", "defaultVariableInstance"})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StringVariableDescriptor", value = StringDescriptorEntity.class),
    @JsonSubTypes.Type(name = "ListVariableDescriptor", value = ListDescriptorEntity.class),
    @JsonSubTypes.Type(name = "MCQVariableDescriptor", value = MCQDescriptorEntity.class),
    @JsonSubTypes.Type(name = "NumberVariableDescriptor", value = NumberDescriptorEntity.class),
    @JsonSubTypes.Type(name = "InboxDescriptor", value = InboxDescriptorEntity.class)
})
public class VariableDescriptorEntity<T extends VariableInstanceEntity> extends NamedEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @Column(name = "variabledescriptor_id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "var_desc_seq")
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
    @JoinColumn(name = "gamemodel_id")
    //@JsonBackReference("gamemodel-variabledescriptor")
    private GameModelEntity gameModel;
    /**
     * Here we cannot use type T, otherwise
     */
    @OneToOne(cascade = {CascadeType.ALL})
    private VariableInstanceEntity defaultVariableInstance;
    /*
     * @OneToOne(cascade = CascadeType.ALL) @NotNull @JoinColumn(name
     * ="SCOPE_ID", unique = true, nullable = false, insertable = true,
     * updatable = true)
     */
    @OneToOne(cascade = {CascadeType.ALL})
    @JsonManagedReference("variabledescriptor-scope")
    private ScopeEntity scope;

    /**
     *
     */
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
     * @param player
     * @return
     */
    @XmlTransient
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
    @JsonBackReference("gamemodel-variabledescriptor")
    public void setGameModel(GameModelEntity gameModel) {
        this.gameModel = gameModel;
    }

    /**
     *
     * @return
     */
    @JsonBackReference("gamemodel-variabledescriptor")
    public GameModelEntity getGameModel() {
        return this.gameModel;
    }

    /**
     * @return the scope
     */
    @JsonManagedReference("variabledescriptor-scope")
    public ScopeEntity getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set
     */
    @JsonManagedReference("variabledescriptor-scope")
    public void setScope(ScopeEntity scope) {
        this.scope = scope;
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
}
