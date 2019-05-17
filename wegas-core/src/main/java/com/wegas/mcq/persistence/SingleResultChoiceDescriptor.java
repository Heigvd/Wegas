/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.Table;

import com.wegas.editor.Schema;
import com.wegas.editor.JSONSchema.JSONArray;
import com.wegas.editor.View.View;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "MCQSingleResultChoiceDescriptor")
@Schema(property = "results",
        value = SingleResultChoiceDescriptor.SingleResultProp.class,
        view = @View(label = "Result"))
public class SingleResultChoiceDescriptor extends ChoiceDescriptor {

    public static class SingleResultProp extends JSONArray {

        public SingleResultProp() {
            this.setMinItems(1);
            this.setMaxItems(1);

            final ObjectMapper mapper = new ObjectMapper();
            ArrayNode arrayNode = mapper.createArrayNode();
            ObjectNode objectNode = mapper.createObjectNode();
            objectNode.put("@class", "Result");
            arrayNode.add(objectNode);
            this.setValue(arrayNode);
        }
    }

    private static final long serialVersionUID = 1L;

    /**
     * When a choice is created, automatically add a result.
     */
    @PrePersist
    public void prePersist2() {
        if (this.getResults().isEmpty()) {
            Result result = new Result();
            result.setName("default");
            this.addResult(result);
        }
    }
}
