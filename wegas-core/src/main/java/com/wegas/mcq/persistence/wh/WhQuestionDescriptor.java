/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence.wh;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.PrimitiveDescriptorI;
import com.wegas.core.persistence.variable.primitive.StaticTextDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nHtmlView;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jdk.nashorn.api.scripting.JSObject;

/**
 *
 * @author Maxence
 */
@Entity
@NamedQuery(name = "WhQuestionDescriptor.findDistinctChildrenLabels",
    query = "SELECT DISTINCT(child.label) FROM VariableDescriptor child WHERE child.parentWh.id = :containerId")
@Table(
    indexes = {
        @Index(columnList = "description_id")
    }
)
public class WhQuestionDescriptor extends VariableDescriptor<WhQuestionInstance>
    implements DescriptorListI<VariableDescriptor> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        nullable = false, optional = false, proposal = EmptyI18n.class,
        view = @View(label = "Description", value = I18nHtmlView.class))
    private TranslatableContent description;

    @OneToMany(mappedBy = "parentWh", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @WegasEntityProperty(includeByDefault = false, view = @View(label = "items", value = Hidden.class), notSerialized = true)
    private List<VariableDescriptor> items = new ArrayList<>();

    /**
     * @return the description
     */
    public TranslatableContent getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null) {
            this.description.setParentDescriptor(this);
        }
    }

    /**
     * @return the variableDescriptors
     */
    @Override
    @JsonView(Views.ExportI.class)
    @Scriptable(label = "getItems", wysiwyg = false, dependsOn = DependencyScope.CHILDREN)
    public List<VariableDescriptor> getItems() {
        return Helper.copyAndSortModifiable(this.items, new EntityComparators.OrderComparator<>());
    }

    @JsonIgnore
    @Override
    public List<VariableDescriptor> getRawItems() {
        return this.items;
    }

    @Override
    public void resetItemsField() {
        this.items = new ArrayList<>();
    }

    /**
     *
     * @param gameModel
     */
    @Override
    public void setGameModel(GameModel gameModel) {
        super.setGameModel(gameModel);
        for (VariableDescriptor item : this.getItems()) {
            item.setGameModel(gameModel);
        }
    }

    private boolean isAuthorized(VariableDescriptor child) {
        return child instanceof PrimitiveDescriptorI
            || child instanceof ListDescriptor
            || child instanceof StaticTextDescriptor;
    }

    @Override
    public void setChildParent(VariableDescriptor child) {
        if (isAuthorized(child)) {
            child.setParentWh(this);
        } else {
            throw WegasErrorMessage.error(child.getClass().getSimpleName() + " not allowed in a WhQuestion");
        }
    }

    // ~~~ Sugar for scripts ~~~
    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, boolean value) {
        this.getInstance(p).setActive(value);
    }

    /**
     *
     * @param p
     *
     * @return the player instance active status
     */
    @Scriptable(dependsOn = DependencyScope.SELF)
    public boolean isActive(Player p) {
        WhQuestionInstance instance = this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     */
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void deactivate(Player p) {
        this.setActive(p, false);
    }

    @Scriptable(dependsOn = DependencyScope.NONE)
    public void reopen(Player p) {
        this.getInstance(p).setValidated(false);
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already answers this question
     */
    @Scriptable(label = "has been replied", dependsOn = DependencyScope.SELF)
    public boolean isReplied(Player p) {
        WhQuestionInstance instance = this.getInstance(p);
        return instance.isValidated();
    }

    /**
     * {@link #isReplied ...}
     *
     * @param p
     *
     * @return true if the player has not yet answers this question
     */
    @Scriptable(label = "has not been replied", dependsOn = DependencyScope.SELF)
    public boolean isNotReplied(Player p) {
        return !this.isReplied(p);
    }

    @Scriptable(label = "feedback", dependsOn = DependencyScope.SELF)
    public String getFeedback(Player p) {
        return this.getInstance(p).getFeedback().translateOrEmpty(p);
    }

    /**
     *
     * @param p
     * @param value
     */
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void setFeedback(
        Player p,
        @Param(view = @View(label = "", value = I18nHtmlView.class)) TranslatableContent value) {
        this.getInstance(p).setFeedback(value);
    }

    /**
     * Set feedback from nashorn
     *
     * @param p
     * @param value
     */
    public void setFeedback(Player p, JSObject value) {
        TranslatableContent readFromNashorn = TranslatableContent.readFromNashorn(value);

        TranslatableContent feedback = this.getInstance(p).getFeedback();

        if (readFromNashorn != null) {
            if (feedback != null) {
                feedback.merge(readFromNashorn);
            } else {
                this.getInstance(p).setFeedback(readFromNashorn);
            }
        } else {
            this.getInstance(p).setFeedback(null);
        }
    }

    // This method seems to be unused:
    public int getUnreadCount(Player player) {
        WhQuestionInstance instance = this.getInstance(player);
        return instance.getActive() && !instance.isValidated() ? 1 : 0;
    }
}
