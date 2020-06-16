/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

import ch.albasim.wegas.annotations.CommonView;

/**
 * @author maxence
 */
public abstract class ArrayView extends CommonView {

    @Override
    public String getType() {
        return "array";
    }

    public interface ISortable {

        default boolean getSortable() {
            return true;
        }
    }

    public interface IHighlight {

        default boolean getHighlight() {
            return true;
        }
    }


    public static class Default extends ArrayView {
    }

    public static class Highlight extends ArrayView implements IHighlight {
    }

    public static class Sortable extends ArrayView implements ISortable {
    }

    public static class HighlightAndSortable extends ArrayView implements ISortable, IHighlight {
    }

}
