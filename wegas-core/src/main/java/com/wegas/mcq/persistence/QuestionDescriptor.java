/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import static java.lang.Boolean.FALSE;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.OrderColumn;
import javax.persistence.Table;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "QuestionDescriptor.findDistinctChildrenLabels", query = "SELECT DISTINCT(cd.label) FROM ChoiceDescriptor cd WHERE cd.question.id = :containerId")
})
@Table(
        indexes = {
            @Index(columnList = "description_id")
        }
)
public class QuestionDescriptor extends VariableDescriptor<QuestionInstance> implements DescriptorListI<ChoiceDescriptor> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    @WegasEntityProperty
    private TranslatableContent description;

    /**
     * Set this to true when the choice is to be selected with an HTML
     * radio/checkbox
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean cbx = FALSE;
    /**
     * Determines if choices are presented horizontally in a tabular fashion
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean tabular = FALSE;
    /**
     * Total number of replies allowed. No default value.
     */
    @WegasEntityProperty
    private Integer maxReplies = null;
    /**
     * Minimal number of replies required. Makes sense only with CBX-type questions. No default value.
     */
    @WegasEntityProperty
    private Integer minReplies = null;
    /**
     *
     */
    @OneToMany(mappedBy = "question", cascade = {CascadeType.ALL}/*, orphanRemoval = true*/)
    //@BatchFetch(BatchFetchType.IN)
    @JsonManagedReference
    @OrderColumn(name = "qd_items_order")
    @WegasEntityProperty(includeByDefault = false, callback = DescriptorListI.UpdateChild.class)
    private List<ChoiceDescriptor> items = new ArrayList<>();
    /**
     *
     */
    @ElementCollection
    //@JsonView(Views.ExtendedI.class)
    //@JsonView(Views.EditorI.class)
    @WegasEntityProperty
    private List<String> pictures = new ArrayList<>();

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
        QuestionInstance instance = this.getInstance(p);
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
    public void desactivate(Player p) {
        this.setActive(p, false);
    }

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
     * Backwardcompat for deserialisation
     *
     * @param allowMultipleReplies
     */
    public void setAllowMultipleReplies(boolean allowMultipleReplies) {
        if (!allowMultipleReplies) {
            this.maxReplies = 1;
        }
    }

    /**
     * @return the checkbox flag
     */
    public Boolean getCbx() {
        return cbx;
    }

    /**
     * @param cb if the checkbox mode is set
     */
    public void setCbx(Boolean cb) {
        this.cbx = cb;
    }

    /**
     * @return the tabular flag
     */
    public Boolean getTabular() {
        return tabular;
    }

    /**
     * @param tab if the tabular layout mode is set
     */
    public void setTabular(Boolean tab) {
        this.tabular = tab;
    }

    /**
     * @return the total maximum number of replies allowed
     */
    public Integer getMaxReplies() {
        return maxReplies;
    }

    /**
     * @param maxReplies the maximum number of replies allowed
     */
    public void setMaxReplies(Integer maxReplies) {
        this.maxReplies = maxReplies;
    }

    /**
     * @return the minimum number of replies required
     */
    public Integer getMinReplies() {
        return minReplies;
    }

    /**
     * @param minReplies the minimum number of replies required
     */
    public void setMinReplies(Integer minReplies) {
        this.minReplies = minReplies;
    }

    /**
     * @return the pictures
     */
    public List<String> getPictures() {
        return pictures;
    }

    /**
     * @param pictures the pictures to set
     */
    public void setPictures(List<String> pictures) {
        this.pictures = pictures;
    }

    @Override
    public void setGameModel(GameModel gm) {
        super.setGameModel(gm);
        for (ChoiceDescriptor cd : this.getItems()) {
            cd.setGameModel(gm);
        }
    }

    /**
     *
     * @param p
     *
     * @return true if the player has already answers this question
     */
    public boolean isReplied(Player p) {
        QuestionInstance instance = this.getInstance(p);
        if (this.getCbx()) {
            return instance.getValidated();
        } else {
            return !instance.getReplies(p).isEmpty();
        }
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

    /**
     * @return the variableDescriptors
     */
    @Override
    @JsonView(Views.ExportI.class)
    public List<ChoiceDescriptor> getItems() {
        return items;
    }

    @Override
    public void resetItemsField() {
        this.items = new ArrayList<>();
    }

    /**
     *
     * @param item
     */
    @Override
    public void setChildParent(ChoiceDescriptor item) {
        item.setQuestion(this);
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(getDescription(), criterias)
                || super.containsAll(criterias);
    }

    // This method seems to be unused:
    public int getUnreadCount(Player player) {
        QuestionInstance instance = this.getInstance(player);
        if (this.getCbx()) {
            return instance.getActive() && !instance.getValidated() ? 1 : 0;
        } else {
            return instance.getActive() && instance.getReplies(player).isEmpty() ? 1 : 0;
        }
    }
}
