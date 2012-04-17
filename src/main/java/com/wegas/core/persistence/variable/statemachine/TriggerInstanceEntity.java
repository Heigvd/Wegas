/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.script.ScriptEntity;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.List;
import javax.persistence.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Providers;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 * Trigger: S1->(T1)->S2, S2 final (oneShot)<br/> S1->(T1)->S2->(!T1)->S1 (opposedTrigger)<br/> else S1->(T1)->S1 (loop).<br/>
 * OneShot and OpposedTrigger are exclusive. OneShot wins.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@XmlRootElement
@XmlType(name="TriggerInstance")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class TriggerInstanceEntity extends FiniteStateMachineInstanceEntity {

    

    @Override
    public String toString() {
        return "TriggerInstanceEntity{" + "id=" + this.getId() + ", currentStateId=" + this.getCurrentStateId() + '}';
    }

    /**
     *
     * @param ps
     * @return
     * @throws IOException
     */
    @XmlTransient
    public String toJson(Providers ps) throws IOException {
        // Marshall new version
        OutputStream os = new ByteArrayOutputStream();
        MessageBodyWriter mbw = ps.getMessageBodyWriter(this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.APPLICATION_JSON_TYPE);
        mbw.writeTo(this, this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.WILDCARD_TYPE, null, os);
        return os.toString();
    }
}
