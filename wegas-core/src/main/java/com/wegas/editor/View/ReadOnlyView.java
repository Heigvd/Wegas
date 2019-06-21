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
public interface ReadOnlyView  {

    default public boolean getReadOnly(){
        return true;
    }
}
