/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence.wh;

import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.PrimitiveDescriptorI;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.OrderColumn;

/**
 *
 * @author Maxence
 */
@Entity
@NamedQuery(name = "WhQuestionDescriptor.findDistinctChildrenLabels",
        query = "SELECT DISTINCT(child.label) FROM VariableDescriptor child WHERE child.parentWh.id = :containerId")
public class WhQuestionDescriptor extends VariableDescriptor<WhQuestionInstance>
        implements DescriptorListI<VariableDescriptor> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @WegasEntityProperty
    private String description;

    @OneToMany(mappedBy = "parentWh", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @OrderColumn(name = "whd_items_order")
    @WegasEntityProperty(includeByDefault = false, callback = DescriptorListI.UpdateChild.class)
    private List<VariableDescriptor> items = new ArrayList<>();

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return the variableDescriptors
     */
    @Override
    @JsonView(Views.ExportI.class)
    public List<VariableDescriptor> getItems() {
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

    private boolean isAuthorized(VariableDescriptor child){
        return child instanceof PrimitiveDescriptorI;
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
    public boolean isActive(Player p) {
        WhQuestionInstance instance = this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     */
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    public void deactivate(Player p) {
        this.setActive(p, false);
    }

    public void reopen(Player p){
        this.getInstance(p).setValidated(false);
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already answers this question
     */
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
    public boolean isNotReplied(Player p) {
        return !this.isReplied(p);
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getDescription(), criterias)
                || super.containsAll(criterias);
    }

    // This method seems to be unused:
    public int getUnreadCount(Player player) {
        WhQuestionInstance instance = this.getInstance(player);
        return instance.getActive() && !instance.isValidated() ? 1 : 0;
    }
}
