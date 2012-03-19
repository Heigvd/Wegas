/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.script;

import java.io.Serializable;
import javax.persistence.Embeddable;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
@Embeddable
@XmlType(name = "Script")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class ScriptEntity implements Serializable {

    private String content;

    /**
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }
}
