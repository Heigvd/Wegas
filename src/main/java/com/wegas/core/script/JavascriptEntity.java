/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.script;

import javax.persistence.Embeddable;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Embeddable
public class JavascriptEntity extends ScriptEntity{

    public JavascriptEntity() {
    }

    @Override
    public String toString() {
        return "JavascriptEntity{" + this.getContent() +"}";
    }

}
