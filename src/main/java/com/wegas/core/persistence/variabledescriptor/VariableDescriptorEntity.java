/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.core.persistence.variabledescriptor;

import com.wegas.core.persistence.game.AbstractEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.NamedEntity;
import com.wegas.core.persistence.scope.ScopeEntity;
import com.wegas.core.persistence.variableinstance.VariableInstanceEntity;
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
    @JsonSubTypes.Type(name = "StringVariableDescriptor", value = StringVariableDescriptorEntity.class),
    @JsonSubTypes.Type(name = "ListVariableDescriptor", value = ListVariableDescriptorEntity.class),
    @JsonSubTypes.Type(name = "MCQVariableDescriptor", value = MCQVariableDescriptorEntity.class),
    @JsonSubTypes.Type(name = "NumberVariableDescriptor", value = NumberVariableDescriptorEntity.class)
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
    //@Pattern(regexp = "^\\w*$")
    private String name;
    /**
     *
     */
    @OneToOne(cascade = {CascadeType.ALL})
    private T defaultVariableInstance;
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
    @ManyToOne
    @JoinColumn(name = "gamemodel_id")
    //@JsonBackReference("gamemodel-variabledescriptor")
    private GameModelEntity gameModel;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        VariableDescriptorEntity vd = (VariableDescriptorEntity) a;
        this.setName(vd.getName());
        this.scope.merge(vd.getScope());
        this.defaultVariableInstance.merge(vd.getDefaultVariableInstance());
    }

    /**
     *
     * @param playerId
     * @return
     */
    @XmlTransient
    public T getVariableInstance(Long playerId) {
        return (T) this.scope.getVariableInstance(playerId);
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
