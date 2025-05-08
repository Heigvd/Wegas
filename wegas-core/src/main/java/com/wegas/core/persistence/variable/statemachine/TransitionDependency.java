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
import com.wegas.core.ejb.RequestManager.RequestContext;
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
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 * Indicated the result of a {@link AbstractTransition} condition depends on a variable
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
     * entity ID
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     * The transition which depends on a variable
     */
    @ManyToOne
    @JsonIgnore
    private AbstractTransition transition;

    /**
     * The variable the transition depends on
     */
    @ManyToOne
    @JsonIgnore
    private VariableDescriptor variable;

    /**
     * Name of the variable. This field is set when deserializing entities from clients and when a
     * WegasPatch is applied.
     */
    @Transient
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Variable", value = FlatVariableSelectView.VariableFlatSelector.class)
    )
    private String variableName;

    /**
     * Scope of the dependency.
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = DefaultDependencyScope.class,
        view = @View(
            label = "Scope",
            value = DependencyScopeSelectView.class
        )
    )
    @Column(length = 10, columnDefinition = "character varying(10)")
    @Enumerated(value = EnumType.STRING)
    private DependencyScope scope;

    @Override
    public Long getId() {
        return id;
    }

    /**
     * Get the transition
     *
     * @return the transition
     */
    public AbstractTransition getTransition() {
        return transition;
    }

    /**
     * Set the transition
     *
     * @param transition the new transition
     */
    public void setTransition(AbstractTransition transition) {
        this.transition = transition;
    }

    /**
     * Get the variable
     *
     * @return the variable
     */
    public VariableDescriptor getVariable() {
        return variable;
    }

    /**
     * Set the variable
     *
     * @param variable the new variable
     */
    public void setVariable(VariableDescriptor variable) {
        this.variable = variable;
    }

    /**
     * Get the variable name. If variableName field is set, return its value, otherwhise, try to use
     * the real variable name
     *
     * @return
     */
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

    /**
     * Get the imported variable name from the transient field.
     *
     * @return variable name
     */
    @JsonIgnore
    public String getImportedVariableName() {
        return variableName;
    }

    /**
     * Set variableName field
     *
     * @param variableName new variable name
     */
    public void setVariableName(String variableName) {
        this.variableName = variableName;
    }

    /**
     * Get dependency scope
     *
     * @return the scope
     */
    public DependencyScope getScope() {
        return scope;
    }

    /**
     * Set the dependency scope
     *
     * @param scope new scope
     */
    public void setScope(DependencyScope scope) {
        this.scope = scope;
    }

    /**
     * Get required update permission. (ie. the one from the transition)
     *
     * @return permsission required to update the dependency
     */
    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getTransition().getRequieredUpdatePermission(context);
    }

    /**
     * Get required read permission. (ie. the one from the transition)
     *
     * @return permsission required to read the dependency
     */
    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getTransition().getRequieredReadPermission(context);
    }

    /**
     * The parent, ie the transition.
     *
     * @return the transition
     */
    @Override
    public WithPermission getMergeableParent() {
        return transition;
    }

    /**
     * Make sure the dependency is registered by the variable.
     */
    public void registerInVariable() {
        if (this.getVariable() != null) {
            this.getVariable().getMayTrigger().add(this);
        }
    }

    /**
     * Form view for the scope.
     */
    public static class DependencyScopeSelectView extends SelectView {

        public DependencyScopeSelectView() {
            super(
                new Choice("Self", "SELF"),
                new Choice("Children", "CHILDREN"),
                new Choice("Unknown", "UNKNOWN")
            );
        }
    }

    /**
     * Form default scope value.
     */
    public static class DefaultDependencyScope implements ValueGenerator {

        @Override
        public String getValue() {
            return DependencyScope.SELF.name();
        }
    }

    /**
     * Make sure to clean references when deleting a dependency.
     *
     * @param beans some facades
     */
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

    @Override
    public String toString() {
        return "TransitionDependency{" + "id=" + id
            + ", transition=" + transition
            + ", variable=" + getVariableName()
            + ", scope=" + scope + '}';
    }
}
