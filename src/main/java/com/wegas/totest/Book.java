/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.totest;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
public class Book implements java.io.Serializable{

    @Id
    @GeneratedValue
    private long id;

    private String title;

}
