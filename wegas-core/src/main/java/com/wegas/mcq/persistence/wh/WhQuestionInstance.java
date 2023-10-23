/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence.wh;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.ValueGenerators.True;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.mcq.persistence.ReadableInstance;
import static java.lang.Boolean.FALSE;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * @author Maxence
 */

@Table(indexes = {
    @Index(columnList = "feedback_id")
})
@Entity
public class WhQuestionInstance extends VariableInstance implements ReadableInstance {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstance.class);

    /**
     *
     */
    @WegasEntityProperty(
            nullable = false, optional = false, proposal = True.class,
            view = @View(label = "Active"))
    private Boolean active = true;

    /**
     *
     */
    @WegasEntityProperty(
            nullable = false, optional = false, proposal = True.class,
            view = @View(label = "Unread", value= Hidden.class))
    private Boolean unread = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            nullable = false, optional = false, proposal = False.class,
            view = @View(label = "Validated", value= Hidden.class))
    private Boolean validated = FALSE;

    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(view = @View(label = "Feedback", value = I18nHtmlView.class))
    private TranslatableContent feedback;


/**
     * @return the value
     */
    public TranslatableContent getFeedback() {
        return feedback;
    }

    /**
     * @param value the value to set
     */
    public void setFeedback(TranslatableContent value) {
        this.feedback = value;
        if (this.feedback != null) {
            this.feedback.setParentInstance(this);
        }
    }

    /**
     * @return the active
     */
    @Override
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    @Override
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @param validated the validation status to set
     */
    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    /**
     * @return The validation status of the question
     */
    public Boolean isValidated() {
        return this.validated;
    }

    @Override
    public Boolean isUnread() {
        return unread;
    }

    @Override
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    // ~~~ Sugar ~~~
    /**
     *
     */
    public void activate() {
        this.setActive(true);
    }

    /**
     *
     */
    public void desactivate() {
        this.deactivate();
    }

    /**
     *
     */
    public void deactivate() {
        this.setActive(false);
    }

}
