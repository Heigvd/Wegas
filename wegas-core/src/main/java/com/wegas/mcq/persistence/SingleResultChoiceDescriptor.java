/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import ch.albasim.wegas.annotations.View;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Script;
import com.wegas.editor.Schema;
import com.wegas.editor.jsonschema.JSONArray;
import com.wegas.editor.view.ArrayView;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.Table;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "MCQSingleResultChoiceDescriptor")
@Schema(property = "results",
        value = SingleResultChoiceDescriptor.SingleResultProp.class,
        view = @View(label = "Result", value = ArrayView.Default.class))
public class SingleResultChoiceDescriptor extends ChoiceDescriptor {

    private static final long serialVersionUID = 1L;

    public static class SingleResultProp extends JSONArray {

        public SingleResultProp() {
            this.setMinItems(1);
            this.setMaxItems(1);

            List<Result> results = new ArrayList<>();
            Result result = new Result();
            result.setVersion(0l);

            result.setImpact(new Script());
            result.setIgnorationImpact(new Script());

            TranslatableContent emptyI18n = new TranslatableContent();
            emptyI18n.setVersion(0l);

            result.setAnswer(emptyI18n);
            result.setIgnorationAnswer(emptyI18n);
            result.setLabel(emptyI18n);

            results.add(result);
            this.setValue(results);
            this.setIndex(1000);
        }
    }

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
