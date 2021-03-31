/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.ValueGenerator;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.view.FlatVariableSelectView;
import com.wegas.editor.view.SelectView;
import com.wegas.editor.view.SelectView.Choice;
import java.util.Collection;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

/**
 *
 * @author maxence
 */
@Entity
@Table(
    indexes = {
        @Index(columnList = "transition_id"),
        @Index(columnList = "variable_id")
    }
)
public class TransitionDependency extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JsonIgnore
    private AbstractTransition transition;

    @ManyToOne
    @JsonIgnore
    private VariableDescriptor variable;

    @Transient
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Variable", value = FlatVariableSelectView.VariableFlatSelector.class)
    )
    private String variableName;

    @WegasEntityProperty(
        optional = false, nullable = false, proposal = DefaultDependencyScope.class,
        view = @View(
            label = "Scope",
            value = DependencyScopeSelectView.class
        )
    )
    @Column(length = 10, columnDefinition = "character varying(10) default 'LIVE'::character varying")
    @Enumerated(value = EnumType.STRING)
    private DependencyScope scope;

    @Override
    public Long getId() {
        return id;
    }

    public AbstractTransition getTransition() {
        return transition;
    }

    public void setTransition(AbstractTransition transition) {
        this.transition = transition;
    }

    public VariableDescriptor getVariable() {
        return variable;
    }

    public void setVariable(VariableDescriptor variable) {
        this.variable = variable;
    }

    public String getVariableName() {
        if (variableName != null) {
            return variableName;
        } else {
            if (variable != null) {
                return variable.getName();
            } else {
                return null;
            }
        }
    }

    @JsonIgnore
    public String getImportedVariableName() {
        return variableName;
    }

    public void setVariableName(String variableName) {
        this.variableName = variableName;
    }

    public DependencyScope getScope() {
        return scope;
    }

    public void setScope(DependencyScope scope) {
        this.scope = scope;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getTransition().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getTransition().getRequieredReadPermission();
    }

    @Override
    public WithPermission getMergeableParent() {
        return transition;
    }

    public void registerInVariable() {
        if (this.getVariable() != null) {
            this.getVariable().getMayTrigger().add(this);
        }
    }

    public static class DependencyScopeSelectView extends SelectView {

        public DependencyScopeSelectView() {
            super(
                new Choice("Self", "SELF"),
                new Choice("Children", "CHILDREN"),
                new Choice("Unknown", "UNKNOWN")
            );
        }
    }

    public static class DefaultDependencyScope implements ValueGenerator {

        @Override
        public String getValue() {
            return DependencyScope.SELF.name();
        }
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.getVariable() != null) {
            // make sure the variable does not reference the dependency any-longer
            VariableDescriptorFacade vdf = beans.getVariableDescriptorFacade();
            VariableDescriptor desc = vdf.find(this.getVariable().getId());
            if (desc != null) {
                desc.getMayTrigger().remove(this);
            }
        }

        if (this.getTransition() != null) {
            // make sure the transition does not reference the dependency any-longer
            StateMachineFacade fsmf = beans.getStateMachineFacade();
            AbstractTransition t = fsmf.findTransition(this.getTransition().getId());
            if (t != null) {
                t.getDependencies().remove(this);
            }
        }

    }
}
