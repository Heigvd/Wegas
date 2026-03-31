package com.wegas.announcement.persistence;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.Collection;
import java.util.Date;

@Entity
@Table
public class Announcement extends AbstractEntity {

    @Id
    @GeneratedValue
    private Long id;

    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date creationTime = new Date();

    /**
     * Intervention start time if any
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @WegasEntityProperty
    private Date interventionStartTime;

    /**
     * Intervention end time if any
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @WegasEntityProperty
    private Date interventionEndTime;

    /**
     * Start time of the announcement
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @WegasEntityProperty(nullable = false, optional = false)
    private Date displayStartTime;

    /**
     * End time of the announcement
     */
    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    @WegasEntityProperty(nullable = false, optional = false)
    private Date displayEndTime;

    /**
     * Displayed message to the user
     */
    @Lob
    @WegasEntityProperty(nullable = false, optional = false)
    private String message;

    /**
     * Don't change, used in DB
     */
    enum MessageType {
        INFO,
        WARNING,
    }

    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'INFO'::character varying")
    @NotNull
    @WegasEntityProperty(sameEntityOnly = true, nullable = false, optional = false)
    private MessageType messageType = MessageType.INFO;

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestManager.RequestContext context) {
        return WegasMembership.ADMIN;
    }

    @Override
    public WithPermission getMergeableParent() {
        return null;
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "(" + this.getId() + ")";
    }

    /**** GETTER & SETTERS ***/

    /**
     * @return the announcement creation time
     */
    @WegasExtraProperty(nullable = false, optional = false)
    public Date getCreationTime() { return creationTime; }

    public Date getInterventionStartTime() {
        return interventionStartTime;
    }

    public void setInterventionStartTime(Date startTime) {
        this.interventionStartTime = startTime;
    }

    public Date getInterventionEndTime() {
        return interventionEndTime;
    }

    public void setInterventionEndTime(Date endTime) {
        this.interventionEndTime = endTime;
    }

    public Date getDisplayStartTime() {
        return displayStartTime;
    }

    public void setDisplayStartTime(Date startDisplayTime) {
        this.displayStartTime = startDisplayTime;
    }

    public Date getDisplayEndTime() {
        return displayEndTime;
    }

    public void setDisplayEndTime(Date endDisplayTime) {
        this.displayEndTime = endDisplayTime;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

}
