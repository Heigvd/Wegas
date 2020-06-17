/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

import ch.albasim.wegas.annotations.JSONSchema;
import com.wegas.editor.view.FlatVariableSelectView;

/**
 *
 * @author maxence
 */
public class ListOfTasksSchema extends JSONArray {

    @Override
    public JSONSchema getItems() {
        JSONString aTask = new JSONString(false);
        aTask.setView(new FlatVariableSelectView.TaskFlatSelector());
        return aTask;
    }
}
