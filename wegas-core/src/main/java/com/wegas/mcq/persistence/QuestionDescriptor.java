/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;
import javax.persistence.Table;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "QuestionDescriptor")
@Table(name = "MCQQuestionDescriptor")
public class QuestionDescriptor extends ListDescriptor {

    private static final long serialVersionUID = 1L;
    // private static final Logger logger = LoggerFactory.getLogger(QuestionDescriptor.class);
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.EditorI.class)
    private String description;
    /**
     *
     */
    private boolean allowMultipleReplies = false;
    /**
     *
     */
    @ElementCollection
    //@JsonView(Views.EditorI.class)
    private List<String> pictures = new ArrayList<>();

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        QuestionDescriptor other = (QuestionDescriptor) a;
        this.setDescription(other.getDescription());
        this.setAllowMultipleReplies(other.getAllowMultipleReplies());
        this.setPictures(other.getPictures());
    }
// *** Sugar for scripts *** //

    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, boolean value) {
        ((QuestionInstance) this.getInstance(p)).setActive(value);
    }

    /**
     *
     * @param p
     * @return
     */
    public Boolean isActive(Player p) {
        QuestionInstance instance = (QuestionInstance) this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     */
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
        this.setActive(p, false);
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
     * @return the multipleReplies
     */
    public boolean getAllowMultipleReplies() {
        return allowMultipleReplies;
    }

    /**
     * @param allowMultipleReplies
     */
    public void setAllowMultipleReplies(boolean allowMultipleReplies) {
        this.allowMultipleReplies = allowMultipleReplies;
    }

    /**
     * @return the pictures
     */
    public List<String> getPictures() {
        return pictures;
    }

    /**
     * @param pictures the pictures to set
     */
    public void setPictures(List<String> pictures) {
        this.pictures = pictures;
    }

    /**
     *
     * @param p
     * @return
     */
    public Boolean isReplied(Player p) {
        QuestionInstance instance = (QuestionInstance) this.getInstance(p);
        return !instance.getReplies().isEmpty();
    }
}
