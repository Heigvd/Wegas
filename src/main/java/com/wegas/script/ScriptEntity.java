/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.script;

import java.io.Serializable;
import javax.persistence.Embeddable;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
@Embeddable
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
