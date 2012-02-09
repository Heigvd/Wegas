/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.variableinstance;

import com.wegas.persistence.AnonymousEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQVariableInstance")
public class MCQVariableInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQVariableInstanceEntity");
    /**
     * 
     */
    @OneToMany(mappedBy = "mCQVariableInstance", cascade = {CascadeType.ALL}, orphanRemoval = true/*, fetch = FetchType.LAZY*/)
    @JsonManagedReference("question-replyi")
    @JoinColumn(name = "variableinstance_id")
    private List<MCQVariableInstanceReplyEntity> replies = new ArrayList<MCQVariableInstanceReplyEntity>();
    /**
     * 
     */
    private boolean active = true;

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
    public List<MCQVariableInstanceReplyEntity> getReplies() {
        return replies;
    }

    /**
     * @param replies the replies to set
     */
    public void setReplies(List<MCQVariableInstanceReplyEntity> replies) {
//        this.replies.clear();
        this.replies = replies;

        //  if (replies != null) {
        for (MCQVariableInstanceReplyEntity r : replies) {
            r.setMCQVariableInstance(this);
        }
        //  }
    }

    public void addReply(MCQVariableInstanceReplyEntity reply) {
        this.replies.add(reply);
        reply.setMCQVariableInstance(this);
    }

    @Override
    public void merge(AnonymousEntity a) {
        MCQVariableInstanceEntity vi = (MCQVariableInstanceEntity) a;
        this.setActive(vi.getActive());

        List<MCQVariableInstanceReplyEntity> newReplies = new ArrayList<MCQVariableInstanceReplyEntity>();
        //newReplies.addAll(vd.getReplies());
        for (MCQVariableInstanceReplyEntity nReply : vi.getReplies()) {
            int pos = this.replies.indexOf(nReply);
            if (pos == -1) {
                newReplies.add(nReply);
            } else {
                MCQVariableInstanceReplyEntity oReply = this.replies.get(pos);
                oReply.merge(nReply);
                newReplies.add(oReply);
            }
        }
        this.setReplies(newReplies);
    }
    /*
    @Override
    public MCQVariableInstanceEntity clone() {
    MCQVariableInstanceEntity c = (MCQVariableInstanceEntity) super.clone();
    //  List<MCQVariableInstanceReplyEntity> replies = new ArrayList<MCQVariableInstanceReplyEntity>();
    //  c.setReplies(replies);
    return c;
    }*/
}