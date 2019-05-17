/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.View;

/**
 * @author maxence
 */
public abstract class ArrayView extends CommonView {

    @Override
    public String getType() {
        return "array";
    }

    public static interface ISortable {

        public default boolean getSortable() {
            return true;
        }
    }

    public static interface IHighlight {

        public default boolean getHighlight() {
            return true;
        }
    }

    public static class Highlight extends ArrayView implements IHighlight {
    }

    public static class Sortable extends ArrayView implements ISortable {
    }

    public static class HighlightAndSortable extends ArrayView implements ISortable, IHighlight {
    }

}
