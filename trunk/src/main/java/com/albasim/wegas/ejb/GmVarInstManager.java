/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmCardinality;
import com.albasim.wegas.persistance.GmEnumItem;
import com.albasim.wegas.persistance.GmInstance;
import com.albasim.wegas.persistance.GmVariableDescriptor;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.albasim.wegas.persistance.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistance.cardinality.GmEqualCardinality;
import com.albasim.wegas.persistance.cardinality.GmOneCardinality;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
import com.albasim.wegas.persistance.instance.GmIntegerInstance;
import com.albasim.wegas.persistance.type.GmEnumType;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class GmVarInstManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmInstanceManager im;


    @EJB
    private Dispatcher dispatcher;


    @PersistenceContext(unitName = "metaPU")
    private EntityManager em;


    public GmVariableInstance getVariableInstance(String gID, String vID,
                                                  Terminal terminal) {
        GmVariableInstance v = em.find(GmVariableInstance.class, Long.parseLong(vID));

        if (v != null) {
            GameModel theGm = v.getGameModel();
            if (gmm.getGameModel(gID, null).equals(theGm)) {
                dispatcher.registerObject(v, terminal);
                return v;
            }
            throw new InvalidContent();
        }
        throw new NotFound();
    }


    /**
     * This prePersist method ensure the variable contains all required instances
     * according to specified cardinality 
     * 
     * It also ensure that a parent is set
     * 
     */
    public void variableInstancePrePersist(GmVariableInstance vi) {
        dispatcher.create(vi);
        if (vi.getParentComplexInstance() == null && vi.getParentGameModel() == null) {
            throw new InvalidContent("Orphan Variable Instance");
        }
        if (vi.getParentComplexInstance() != null && vi.getParentGameModel() != null) {
            throw new InvalidContent("Variable Instance as two parent !");
        }

        // Be sure the instance list exists
        if (vi.getInstances() == null) {
            vi.setInstances(new ArrayList<GmInstance>());
        }

        List<GmInstance> instances = vi.getInstances();

        GmVariableDescriptor theDesc = vi.getDescriptor();
        GmCardinality theCard = theDesc.getCardinality();

        if (theCard instanceof GmOneCardinality) {
            // One and only one instance. Named "1"

            // Make sure the list is not null
            if (instances.size() == 1) {
                // Check instance name && instance type 

                GmInstance inst = instances.get(0);
                if (!"1".equals(inst.getName())) {
                    throw new InvalidContent("Instance shall be named \"1\", not \"" + inst.getName() + "\" (" + vi.getName() + ")");
                }

                XmlType annotation = inst.getClass().getAnnotation(XmlType.class);
                if (!theDesc.getType().getInstanceType().equals(annotation.name())) {
                    throw new InvalidContent("Instance is not instance of \"" + theDesc.getType().getInstanceType() + "\" but \"" + annotation.name() + "\"");
                }
            } else if (instances.size() > 1) {
                throw new InvalidContent("One-Cardinalized Variable Request one and only one instance");
            } else {
                // There is no variable ! Create one
                GmInstance theInst = theDesc.getType().createInstance("1", vi, null);
                instances.add(theInst);
            }
        } else if (theCard instanceof GmEqualCardinality) {
            GameModel gameModel = vi.getGameModel();
            Integer number = null;

            GmEqualCardinality eqCard = (GmEqualCardinality) theCard;

            String v = eqCard.getV();
            try {
                number = Integer.parseInt(v);
            } catch (NumberFormatException ex) {
                logger.log(Level.INFO, "Resolve INT:");
                GmIntegerInstance resolved = gameModel.resolveIntInstance(vi);
                logger.log(Level.INFO, "  -> {0}", resolved);
                number = resolved.getV();
                vi.setIntegerInstance(resolved);
            }

            if (number != null) {
                if (number <= 0) {
                    throw new InvalidContent("IntInstance value shall be grater than zero");
                } else {
                    boolean[] instanceOK = new boolean[number];
                    // first check that existing instances are correct
                    for (GmInstance instance : instances) {

                        // Check the type
                        XmlType annotation = instance.getClass().getAnnotation(XmlType.class);
                        if (!theDesc.getType().getInstanceType().equals(annotation.name())) {
                            throw new InvalidContent("Instance is not instance of \"" + theDesc.getType().getInstanceType() + "\" but \"" + annotation.name() + "\"");
                        }

                        // Check the name (i.e. index)
                        String name = instance.getName();
                        Integer intName = Integer.parseInt(name);

                        // Name uniqueness
                        if (intName < 1 || intName > number) {
                            throw new InvalidContent("Instance index out of bound : " + name);
                        } else {
                            if (instanceOK[intName - 1]) {
                                throw new InvalidContent("Duplicata for " + name);
                            } else {
                                instanceOK[intName - 1] = true;
                            }
                        }
                    }

                    // Second step : propagateCreate all missing instances
                    for (Integer i = 1; i <= number; i++) {
                        if (!instanceOK[i - 1]) {
                            // Means a instance with index 1i+1 shall be created
                            GmInstance theInst = theDesc.getType().createInstance(i.toString(), vi, null);
                            instances.add(theInst);
                        }
                    }
                }
            } else {
                throw new InvalidContent("IntInstance for equal-cardinality is not set");
            }
        } else if (theCard instanceof GmEnumCardinality) {
            GmEnumCardinality enumCard = (GmEnumCardinality) theCard;
            GmEnumType enumType = enumCard.getEnumeration();

            int size = enumType.getItems().size();

            if (size < instances.size()) {
                throw new InvalidContent("There is too much instances within enum cardinalized variable \"" + vi.getStringName() + "\"");
            }
            for (GmInstance i : instances) {
                GmEnumItem lookupItem = enumType.lookupItem(i.getName());
                if (lookupItem != null) {
                    i.setEnumItem(lookupItem);
                } else {
                    throw new InvalidContent("The is no item named \"" + i.getName() + "\" within the \"" + enumType.getName() + "\" enumeration");
                }
            }

            for (GmEnumItem it : enumType.getItems()) {
                GmInstance lookupInstance = vi.lookupInstance(it.getName());
                if (lookupInstance == null) {
                    GmInstance theInst = theDesc.getType().createInstance(it.getName(), vi, it);
                    instances.add(theInst);
                }
            }
        }

        if (instances != null) {
            for (GmInstance i : instances) {
                i.setVariable(vi);
                im.instancePrePersist(i);
            }
        }
    }


    public void variableInstancePreDestroy(GmVariableInstance vi) {
        for (GmInstance i : vi.getInstances()){
            im.instancePreDestroy(i);
        }
        dispatcher.remove(vi);
    }


    void detachAll(GameModel gameModel, Terminal terminal) {
        for (GmVariableInstance vi : gameModel.getVariableInstances()){
            detach(vi, terminal);
        }
    }
        

    void detach(GmVariableInstance vi, Terminal terminal) {

        im.detachAll(vi, terminal);
        
        dispatcher.detach(vi, terminal);
    }


    void detachAll(GmComplexInstance gmComplexInstance, Terminal terminal) {
        for (GmVariableInstance vi : gmComplexInstance.getVariableInstances()){
            detach(vi, terminal);
        }
    }



}
