/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.Iterator;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.VariableProperty;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
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
    @WegasEntityProperty
    private TranslatableContent description;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty
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
    public void getConfidence(Player p) {
        this.getInstance(p).getConfidence();
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
     * @return value matching the key from given player's instance, cast to
     *         double, or Double.NaN
     */
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
    public void addNumberAtInstanceProperty(Player p, String key, String value) {
        try {
            this.getInstance(p).setProperty(key, "" + (Float.parseFloat(this.getInstance(p).getProperty(key)) + Float.parseFloat(value)));
        } catch (NumberFormatException e) {
            // do nothing...
        }
    }

    /**
     *
     * @param p
     * @param time
     * @param editable
     * @param description
     */
    public void addOccupation(Player p, int time, Boolean editable, String description) {
        ResourceInstance instance = this.getInstance(p);
        Occupation occupation = new Occupation();
        occupation.setDescription(description);
        occupation.setEditable(editable);
        occupation.setTime(time);
        instance.addOccupation(occupation);
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

    //Methods below are temporary ; only for CEP-Game
    /**
     *
     * @param p
     */
    public void getSalary(Player p) {
        this.getInstance(p).getProperty("salary");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setSalary(Player p, Integer value) {
        this.getInstance(p).setProperty("salary", "" + value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtSalary(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("salary")) + value;
        instance.setProperty("salary", "" + newVal);
    }

    /**
     *
     * @param p
     */
    public void getExperience(Player p) {
        this.getInstance(p).getProperty("experience");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setExperience(Player p, Integer value) {
        this.getInstance(p).setProperty("experience", "" + value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtExperience(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("experience")) + value;
        instance.setProperty("experience", "" + newVal);
    }

    /**
     *
     * @param p
     */
    public void getLeadershipLevel(Player p) {
        this.getInstance(p).getProperty("leadershipLevel");
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setLeadershipLevel(Player p, Integer value) {
        this.getInstance(p).setProperty("leadershipLevel", "" + value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtLeadershipLevel(Player p, Integer value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("leadershipLevel")) + value;
        instance.setProperty("leadershipLevel", "" + newVal);
    }

    /**
     *
     * @param p
     *
     * @return true is the player's resourceInstance is active
     */
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
}
