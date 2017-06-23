/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.watson;

import java.util.List;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateExample;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateIntent;

/**
 *
 * @author Pierre-Adrien Ghiringhelli
 */


public class WIntent {
    
    private String intent;
    private String description;
    private List<CreateExample> examples;
    
    public static List<CreateExample> textsToExamples(List<String> texts){
        List<CreateExample> examples = null;
        texts.forEach((text) -> {
            examples.add(new CreateExample.Builder().text(text).build());
        });
        return examples;
    }
    
    public static CreateIntent wintentToIntent(WIntent i){
        return new CreateIntent.Builder()
                .intent(i.getIntent())
                .description(i.getDescription())
                .examples(i.getExamples()).build();
    }

    /**
     * @return the intent
     */
    public String getIntent() {
        return intent;
    }

    /**
     * @param intent the intent to set
     */
    public void setIntent(String intent) {
        this.intent = intent;
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

    /**
     * @return the examples
     */
    public List<CreateExample> getExamples() {
        return examples;
    }

    /**
     * @param examples the examples to set
     */
    public void setExamples(List<CreateExample> examples) {
        this.examples = examples;
    }
}
