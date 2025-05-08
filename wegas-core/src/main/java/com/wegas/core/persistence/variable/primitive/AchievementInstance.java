/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.Visible;
import jakarta.persistence.Entity;

/**
 *
 * @author Maxence
 */
@Entity
public class AchievementInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @WegasEntityProperty(proposal = False.class, optional = false, nullable = false,
        view = @View(label = "Value"))
    @Visible(VariableInstance.IsNotDefaultInstance.class)
    private boolean achieved;

    /**
     * @return achieved
     */
    public boolean isAchieved() {
        return achieved;
    }

    /**
     * @param achieved the achieved to set
     */
    public void setAchieved(boolean achieved) {
        this.achieved = achieved;
    }
}
