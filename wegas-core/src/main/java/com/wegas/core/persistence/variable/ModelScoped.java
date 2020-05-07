/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.annotations.WegasConditions;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.Equals;
import com.wegas.core.persistence.annotations.WegasConditions.Or;
import com.wegas.core.persistence.annotations.WegasRefs;
import com.wegas.core.persistence.game.GameModel;

/**
 *
 * @author maxence
 */
public interface ModelScoped {

    /**
     * INTERNAL -> TO BE RENAMED PROTECTED INHERITED PRIVATE
     */
     enum Visibility {
        /**
         * <ul>
         * <li>propagated: true</li>
         * <li>designer: write</li>
         * <li>scenarist: read only</li>
         * </ul>
         */
        INTERNAL,
        /**
         * <ul>
         * <li>propagated: true</li>
         * <li>designer: write</li>
         * <li>scenarist: read only, but write for default instance and items</li>
         * </ul>
         */
        PROTECTED,
        /**
         * <ul>
         * <li>propagated: true</li>
         * <li>designer: write</li>
         * <li>scenarist: write</li>
         * </ul>
         */
        INHERITED,
        /**
         * <ul>
         * <li>propagated: false (when updating but true when creating ???)</li>
         * <li>designer: n/a</li>
         * <li>scenarist: write</li>
         * </ul>
         */
        PRIVATE
    }

    Visibility getVisibility();

    void setVisibility(Visibility visibility);

    class BelongsToModel extends Or {

        public BelongsToModel() {
            super(
                new Equals(
                    new WegasRefs.Field(GameModel.class, "status"),
                    new WegasRefs.Const(GameModel.GmType.MODEL)
                ),
                new And(
                    new WegasConditions.IsDefined(
                        new WegasRefs.Field(GameModel.class, "basedOnId")
                    ),
                    new Equals(
                        new WegasRefs.Field(GameModel.class, "status"),
                        new WegasRefs.Const(GameModel.GmType.SCENARIO)
                    )
                )
            );
        }
    }
}
