/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-other.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;
import javax.persistence.Lob;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class ResourceDescriptor extends VariableDescriptor<ResourceInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    private String description;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);

        ResourceDescriptor other = (ResourceDescriptor) a;
        this.setDescription(other.getDescription());
    }

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

    // **** Sugar for editor *** //
    public void setConfidence(Player p, int value) {
        this.getInstance(p).setConfidence(value);
    }

    public void addAtConfidence(Player p, int value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setConfidence(instance.getConfidence() + value);
    }

    public void setMoral(Player p, int value) {
        this.getInstance(p).setMoral(value);
    }

    public void addAtMoral(Player p, int value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setMoral(instance.getMoral() + value);
    }

    //Methods below are temporary ; only for CEP-Game
    public void setSalary(Player p, int value) {
        this.getInstance(p).setProperty("salary", "" + value);
    }

    public void addAtSalary(Player p, int value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("salary")) + value;
        instance.setProperty("salary", "" + newVal);
    }

    public void setExperience(Player p, int value) {
        this.getInstance(p).setProperty("experience", "" + value);
    }

    public void addAtExperience(Player p, int value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("experience")) + value;
        instance.setProperty("experience", "" + newVal);
    }

    public void setLeadershipLevel(Player p, int value) {
        this.getInstance(p).setProperty("leadershipLevel", "" + value);
    }

    public void addAtLeadershipLevel(Player p, int value) {
        ResourceInstance instance = this.getInstance(p);
        int newVal = Integer.parseInt(instance.getProperty("leadershipLevel")) + value;
        instance.setProperty("leadershipLevel", "" + newVal);
    }

    public void setActive(Player p, boolean value) {
        ResourceInstance instance = this.getInstance(p);
        instance.setActive(value);
    }
}
