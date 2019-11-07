/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ch.albasim.wegas.annotations.processor;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.HashMap;
import java.util.Map;

/**
 *
 * @author maxence
 */
public class ClassDoc {

    private String packageName;
    private String className;

    private String doc;
    private Map<String, String> fields;
    private Map<String, String> methods;

    public ClassDoc() {
        this.fields = new HashMap<>();
        this.methods = new HashMap<>();
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getDoc() {
        return doc;
    }

    public void setDoc(String doc) {
        this.doc = doc;
    }

    public Map<String, String> getFields() {
        return fields;
    }

    public void setFields(Map<String, String> fields) {
        this.fields = fields;
    }

    public Map<String, String> getMethods() {
        return methods;
    }

    public void setMethods(Map<String, String> methods) {
        this.methods = methods;
    }

    @JsonIgnore
    public String getFullName() {
        return getPackageName() + "." + getClassName();
    }

}
