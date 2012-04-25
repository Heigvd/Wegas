/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "QuestionInstance")
public class QuestionInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstanceEntity.class);
    /**
     *
     */
    @OneToMany(mappedBy = "questionInstance", cascade = {CascadeType.ALL}, orphanRemoval = true /*
     * , fetch = FetchType.LAZY
     */)
    @JsonManagedReference("question-replyi")
    private List<ReplyEntity> replies = new ArrayList<>();
    /**
     *
     */
    private boolean active;

    /**
     * @return the active
     */
    public boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(boolean active) {
        this.active = active;
    }

    /**
     * @return the replies
     */
    public List<ReplyEntity> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    public void setReplies(List<ReplyEntity> replies) {
//        this.replies.clear();
        this.replies = replies;

        //  if (replies != null) {
        for (ReplyEntity r : replies) {
            r.setQuestionInstance(this);
        }
        //  }
    }

    /**
     *
     * @param reply
     */
    public void addReply(ReplyEntity reply) {
        this.replies.add(reply);
        reply.setQuestionInstance(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        QuestionInstanceEntity vi = (QuestionInstanceEntity) a;
        this.setActive(vi.getActive());

        List<ReplyEntity> newReplies = new ArrayList<>();
        //newReplies.addAll(vd.getReplies());
        for (ReplyEntity nReply : vi.getReplies()) {
            int pos = this.replies.indexOf(nReply);
            if (pos == -1) {
                newReplies.add(nReply);
            } else {
                ReplyEntity oReply = this.replies.get(pos);
                oReply.merge(nReply);
                newReplies.add(oReply);
            }
        }
        this.setReplies(newReplies);
    }
    /*
     * @Override public QuestionInstanceEntity clone() { QuestionInstanceEntity
     * c = (QuestionInstanceEntity) super.clone(); //
     * List<MCQReplyInstanceEntity> replies = new
     * ArrayList<MCQReplyInstanceEntity>(); // c.setReplies(replies); return c;
     * }
     */
}