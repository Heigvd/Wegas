/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.view.ColorPicker;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.editor.view.IconSelect;
import com.wegas.editor.view.QuestSelect;
import com.wegas.mcq.persistence.QuestionDescriptor;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.NamedQuery;
import javax.persistence.OneToOne;
import javax.persistence.Table;

/**
 *
 * @author maxence
 */
@Entity
@Table(indexes = {
    @Index(columnList = "message_id")
})
@NamedQuery(
    name = "Achievement.findDistinctQuests",
    query = "SELECT distinct a.quest FROM AchievementDescriptor a WHERE a.gameModel.id = :gameModelId"
)
public class AchievementDescriptor extends VariableDescriptor<AchievementInstance> {

    private static final long serialVersionUID = 1L;

    /**
     * Weight of the achievement. Used to compute compute quest completion.
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.One.class,
        view = @View(label = "weight"))
    @Errored(value = QuestionDescriptor.CheckPositiveness.class, message = "Must be greater than 0")
    private Integer weight;

    /**
     * Message to display when the achievement is unlocked
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(label = "Message", value = I18nHtmlView.class))
    private TranslatableContent message;

    /**
     * The quest this achievement is part of
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.EmptyString.class,
        view = @View(label = "Quest", value = QuestSelect.class))
    private String quest;

    /**
     * An icon name
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.EmptyString.class,
        view = @View(label = "Icon", value = IconSelect.class))
    private String icon;

    /**
     * A HTM/hex color
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.EmptyString.class,
        view = @View(label = "Color", value = ColorPicker.class))
    private String color;

    /**
     * Get the value of message
     *
     * @return the value of message
     */
    public TranslatableContent getMessage() {
        return message;
    }

    /**
     * Set the value of message
     *
     * @param message new value of message
     */
    public void setMessage(TranslatableContent message) {
        this.message = message;
        if (this.message != null) {
            this.message.setParentDescriptor(this);
        }
    }

    /**
     * Get the value of quest
     *
     * @return the value of quest
     */
    public String getQuest() {
        return quest;
    }

    /**
     * Set the value of quest
     *
     * @param quest new value of quest
     */
    public void setQuest(String quest) {
        this.quest = quest;
    }

    /**
     * Get the value of color
     *
     * @return the value of color
     */
    public String getColor() {
        return color;
    }

    /**
     * Set the value of color
     *
     * @param color new value of color
     */
    public void setColor(String color) {
        this.color = color;
    }

    /**
     * Get the value of icon
     *
     * @return the value of icon
     */
    public String getIcon() {
        return icon;
    }

    /**
     * Set the value of icon
     *
     * @param icon new value of icon
     */
    public void setIcon(String icon) {
        this.icon = icon;
    }

    /**
     * Get the value of weight
     *
     * @return the value of weight
     */
    public Integer getWeight() {
        return weight;
    }

    /**
     * Set the value of weight
     *
     * @param weight new value of weight
     */
    public void setWeight(Integer weight) {
        this.weight = weight;
    }

    /**
     * mark the achievement as achieved or not
     *
     * @param p        the player
     * @param achieved achieved or not
     */
    @Scriptable(label = "achieved", dependsOn = DependencyScope.SELF)
    public void setAchieved(Player p, boolean achieved) {
        this.getInstance(p).setAchieved(achieved);
    }

    /**
     * Was the achievement achieved?
     *
     * @param p the player
     *
     * @return true if the achievement has been achieved
     */
    @JsonIgnore
    @Scriptable(dependsOn = DependencyScope.SELF)
    public Boolean isAchieved(Player p) {
        return this.getInstance(p).isAchieved();
    }
}
