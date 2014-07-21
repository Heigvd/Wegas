/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.faces.component.FacesComponent;
import javax.faces.component.UIComponentBase;
import javax.faces.component.html.HtmlGraphicImage;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.apache.shiro.SecurityUtils;

/**
 *
 * Faces component that print a GameModel as xHTML. 
 * 
 * *
 * <pre>
 * <b>Usage:</b>
 * &lt;<b>GameModel</b> <b>value</b>="#{the GameModel}"
 *        <b>player</b>="#{the player to print the gameModel for (may be the default player)}"
 *        <b>mode</b>=["editor" | "player"]
 *        <b>root</b>="a variable descriptor name (i.e scriptAlias, vd.getName()) (optional)"
 *
 * mode: indicates whether or not a full export (mode = "editor") or a player 
 *       export (mode != "editor") shall be done. Editor mode is only 
 *       available for users that have the 'edit' permission on the specified GameModel.
 *       If mode != "editor" or currentUser hasn't this 'edit' permission, mode is degraded to "player"
 * </pre>
 * 
 * See WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag and params definitions
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@FacesComponent("com.wegas.app.pdf.uicomponent.GameModel")
public class UIGameModel extends UIComponentBase {

    private boolean editorMode;

    @Override
    public String getFamily() {
        return "com.wegas.app.pdf.uicomponent.GameModel";
    }

    @Override
    public void encodeBegin(FacesContext context) throws IOException {
        super.encodeBegin(context);
        GameModel gm = (GameModel) getAttributes().get("value");
        Player player = (Player) getAttributes().get("player");
        String root = (String) getAttributes().get("root");
        String modeParam = (String) getAttributes().get("mode");

        // editor mode allowed only if current user has edit permission on gamemodel
        editorMode = "editor".equals(modeParam)
                && SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + gm.getId());
    
        ResponseWriter writer = context.getResponseWriter();

        // Banner with GameModel name
        UIHelper.startSpan(writer, UIHelper.CSS_CLASS_MAIN_TITLE);

        String playerName = "";
        if (player.getUser() != null){
            playerName = " / " + player.getName();
        }
        
        writer.write("Scenario " + gm.getName() + playerName);
        UIHelper.endSpan(writer);

        List<VariableDescriptor> vds;

        // unless root is specified, print header and fetch all descriptors
        if (root == null) {
            encodeGameModelHeader(context, writer, gm);
            vds = gm.getChildVariableDescriptors();
        } else {
            /*
             * when root is specified, do not print headers and start printing 
             * vardesc from root node
             */
            vds = new ArrayList<>();
            VariableDescriptorFacade lookup = VariableDescriptorFacade.lookup();
            VariableDescriptor find = lookup.find(gm, root);
            vds.add(find);
        }

        for (VariableDescriptor vd : vds) {
            UIVariableDescriptor uiVd = new UIVariableDescriptor();
            uiVd.getAttributes().put("value", vd);
            uiVd.getAttributes().put("player", player);
            uiVd.getAttributes().put("editorMode", editorMode);
            uiVd.encodeAll(context);
        }
    }

    /**
     * Print GameModel own properties
     * 
     * @param context
     * @param writer
     * @param gm
     * @throws IOException 
     */
    private void encodeGameModelHeader(FacesContext context, ResponseWriter writer, GameModel gm) throws IOException {
        // links to subdirs
        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_MENU);

        // replace with UI:Define from ListDescriptor Encode method in UIVariableDescriptor
        for (VariableDescriptor vd : gm.getChildVariableDescriptors()) {
            if (vd instanceof ListDescriptor) {
                writer.write("<a href=\"#vd" + vd.getId() + "\" >" + vd.getLabel() + "</a>");
            }
        }
        UIHelper.endDiv(writer);

        UIHelper.printPropertyTextArea(context, writer, "Description", gm.getDescription(), false, editorMode);

        UIHelper.startSpan(writer, UIHelper.CSS_CLASS_MAIN_IMAGE);

        HtmlGraphicImage image = new HtmlGraphicImage();
        String imgSrc;
        if (gm.getProperties().getImageUri().length() > 0) {
            imgSrc = gm.getProperties().getImageUri();
        } else {
            // @todo wegas-app/src/main/webapp/wegas-lobby/js/wegas-lobby-datatable.js 
            imgSrc = "wegas-lobby/images/wegas-game-thumb.png";
        }

        image.setValue(imgSrc);
        image.encodeAll(context);
        UIHelper.endSpan(writer);
    }
}
