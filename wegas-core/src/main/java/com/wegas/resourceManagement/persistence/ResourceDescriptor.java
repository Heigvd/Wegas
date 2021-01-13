/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.VariableProperty;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.ValueGenerators.EmptyMap;
import com.wegas.editor.view.HashListView;
import com.wegas.editor.view.I18nHtmlView;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(
    indexes = {
        @Index(columnList = "description_id")
    }
)
public class ResourceDescriptor extends VariableDescriptor<ResourceInstance> implements Propertable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(label = "Description", index = 1, value = I18nHtmlView.class))
    private TranslatableContent description;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyMap.class,
        view = @View(label = "Descriptor properties", featureLevel = ADVANCED, value = HashListView.class))
    private List<VariableProperty> properties = new ArrayList<>();

    @JsonIgnore
    @Override
    public List<VariableProperty> getInternalProperties() {
        return properties;
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
     * ** Sugar for editor **
     */
    /**
     *
     * @param p
     */
    public int getConfidence(Player p) {
        return this.getInstance(p).getConfidence();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setConfidence(Player p, Integer value) {
        this.getInstance(p).setConfidence(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtConfidence(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setConfidence(instance.getConfidence() + value);
    }

    /**
     *
     * @param p
     *
     * @return resource moral
     *
     * @deprecated
     */
    public Integer getMoral(Player p) {
        return Integer.parseInt(this.getInstance(p).getProperty("motivation"), 10);
    }

    /**
     *
     * @param p
     * @param value
     *
     * @deprecated
     */
    public void setMoral(Player p, Integer value) {
        this.getInstance(p).setProperty("motivation", value.toString());
    }

    /**
     *
     * @param p
     * @param value
     *
     * @deprecated
     */
    public void addAtMoral(Player p, Integer value) {
        this.addNumberAtInstanceProperty(p, "motivation", value.toString());
    }

    /**
     * Get a resource instance property, cast to double
     *
     * @param p
     * @param key
     *
     * @return value matching the key from given player's instance, cast to double, or Double.NaN
     */
    @Scriptable(label = "get number property")
    public double getNumberInstanceProperty(Player p, String key) {
        String value = this.getInstance(p).getProperty(key);
        double parsedValue;
        try {
            parsedValue = Double.parseDouble(value);
        } catch (NumberFormatException e) {
            parsedValue = Double.NaN;
        }
        return parsedValue;
    }

    /**
     *
     * @param p
     * @param key
     *
     * @return value matching the key from given player's instance
     */
    @Scriptable(label = "get text property")
    public String getStringInstanceProperty(Player p, String key) {
        return this.getInstance(p).getProperty(key);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    public void setInstanceProperty(Player p, String key, String value) {
        this.getInstance(p).setProperty(key, value);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    @Scriptable(label = "add to property")
    public void addNumberAtInstanceProperty(Player p,
        @Param(view = @View(label = "Key")) String key,
        @Param(view = @View(label = "Value")) String value) {
        try {
            Double newValue = Double.parseDouble(this.getInstance(p).getProperty(key)) + Double.parseDouble(value);
            this.getInstance(p).setProperty(key, newValue.toString());
        } catch (NumberFormatException e) {
            logger.error("Try to add NaN");
            // do nothing...
        }
    }

    /**
     *
     * @param p
     * @param time
     * @param editable
     */
    @Scriptable
    public void addOccupation(Player p,
        @Param(view = @View(label = "period")) int time,
        @Param(view = @View(label = "editable")) Boolean editable) {
        ResourceInstance instance = this.getInstance(p);
        Occupation occupation = new Occupation();
        occupation.setEditable(editable);
        occupation.setTime(time);
        instance.addOccupation(occupation);
    }

    /**
     * backward comp.
     *
     * @param p
     * @param time
     * @param editable
     * @param description
     */
    @Deprecated
    public void addOccupation(Player p, int time, Boolean editable, String description) {
        this.addOccupation(p, time, editable);
    }

    /**
     *
     * @param p
     * @param time
     */
    public void removeOccupationsAtTime(Player p, double time) {
        ResourceInstance instance = this.getInstance(p);
        for (Iterator<Occupation> it = instance.getOccupations().iterator(); it.hasNext();) {
            Occupation occupation = it.next();
            if (Math.abs(occupation.getTime() - time) < 0.000001) {
                it.remove();
            }
        }
    }

    // as someone said on December 18, 2012:
    //Methods below are temporary ; only for CEP-Game
    /**
     *
     * @param p
     */
    public void getSalary(Player p) { // NOPMD : backward compat
        this.getInstance(p).getProperty("salary");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setSalary(Player p, Integer value) {
        this.getInstance(p).setProperty("salary", value.toString());
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtSalary(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        Integer newVal = Integer.parseInt(instance.getProperty("salary")) + value;
        instance.setProperty("salary", newVal.toString());
    }

    /**
     *
     * @param p
     */
    public void getExperience(Player p) { // NOPMD : backward compat
        this.getInstance(p).getProperty("experience");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setExperience(Player p, Integer value) {
        this.getInstance(p).setProperty("experience", value.toString());
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtExperience(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        Integer newVal = Integer.parseInt(instance.getProperty("experience")) + value;
        instance.setProperty("experience", newVal.toString());
    }

    /**
     *
     * @param p
     */
    public void getLeadershipLevel(Player p) { // NOPMD : backward compat
        this.getInstance(p).getProperty("leadershipLevel");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setLeadershipLevel(Player p, Integer value) {
        this.getInstance(p).setProperty("leadershipLevel", value.toString());
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtLeadershipLevel(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        Integer newVal = Integer.parseInt(instance.getProperty("leadershipLevel")) + value;
        instance.setProperty("leadershipLevel", newVal.toString());
    }

    /**
     *
     * @param p
     *
     * @return true is the player's resourceInstance is active
     */
    @Scriptable(label = "is active")
    public boolean getActive(Player p) {
        ResourceInstance instance = this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, Boolean value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setActive(value);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    @Deprecated
    public void desactivate(Player p) {
        this.deactivate(p);
    }

    @Scriptable
    public void deactivate(Player p) {
        this.setActive(p, false);
    }
}
