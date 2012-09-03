/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-other.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.xml.bind.annotation.XmlType;

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
    @Column(length = 4096)
    private String description;
    /**
     *
     */
    private boolean allowMultipleReplies = false;
    /**
     *
     */
    @ElementCollection
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
     */
    public void activate(Player p) {
        ( (QuestionInstance) this.getInstance(p) ).activate();
    }

    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
        ( (QuestionInstance) this.getInstance(p) ).desactivate();
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
}
