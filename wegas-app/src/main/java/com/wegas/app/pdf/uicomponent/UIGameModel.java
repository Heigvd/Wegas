/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.uicomponent;

import com.wegas.app.pdf.helper.UIHelper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import jakarta.faces.component.FacesComponent;
import jakarta.faces.component.UIComponentBase;
import jakarta.faces.component.html.HtmlGraphicImage;
import jakarta.faces.context.FacesContext;
import jakarta.faces.context.ResponseWriter;
import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Faces component that print a GameModel as xHTML.
 * <p>
 * *
 * <pre>
 * <b>Usage:</b>
 * &lt;<b>GameModel</b> <b>value</b>="#{the GameModel}"
 *        <b>player</b>="#{the player to print the gameModel for (test player means default values)}"
 *        <b>mode</b>=["editor" | "player"]
 *        <b>root</b>="a variable descriptor name (i.e scriptAlias, vd.getName()) (optional)"
 *
 * mode: indicates whether or not a full export (mode = "editor") or a player
 *       export (mode != "editor") shall be done. Editor mode is only
 *       available for users that have the 'edit' permission on the specified GameModel.
 *       If mode != "editor" or != 'reader' or currentUser hasn't this 'edit' permission, mode is degraded to "player"
 * </pre>
 * <p>
 * See WEB-INF/web.xml & WEB-INF/wegas-taglib.xml for tag and params definitions
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
/*
 *
 * Faces 2.2 @FacesComponent(value="com.wegas.app.pdf.uicomponent.GameModel", createTag = true,
 * tagName = "GameModel", namespace ="http://www.albasim.ch/wegas/pdf") But still missing attributes
 * definitions....
 */
//@FacesComponent("com.wegas.app.pdf.uicomponent.GameModel")
@FacesComponent(value = "com.wegas.app.pdf.uicomponent.GameModel", createTag = true, tagName = "Gamemodel", namespace = "http://www.albasim.ch/wegas/pdf")
public class UIGameModel extends UIComponentBase {

    Logger logger = LoggerFactory.getLogger(this.getClass());

    public enum Mode {
        PLAYER,
        READER,
        EDITOR,
    }

    private Mode mode;
    private boolean defaultValues;
    private boolean includeInactive;
    private I18nFacade i18nFacade;

    @Override
    public String getFamily() {
        return "com.wegas.app.pdf.uicomponent.GameModel";
    }

    private I18nFacade getI18nFacade() {
        if (i18nFacade == null) {
            i18nFacade = I18nFacade.lookup();
        }
        return i18nFacade;
    }

    @Override
    public void encodeBegin(FacesContext context) throws IOException {
        super.encodeBegin(context);
        GameModel gm = (GameModel) getAttributes().get("value");
        Player player = (Player) getAttributes().get("player");
        String root = (String) getAttributes().get("root");
        String modeParam = (String) getAttributes().get("mode");
        String inactiveParam = (String) getAttributes().get("inactive");
        String title = (String) getAttributes().get("title");
        String defVal = (String) getAttributes().get("defaultValues");
        Boolean displayPath = "true".equals((String) getAttributes().get("displayPath"));
        String[] roots;

        boolean hasEditRightOnGameModel = SecurityUtils.getSubject()
            .isPermitted("GameModel:Edit:gm" + gm.getId());
        // editor mode and default values only allowedif current user has edit permission on gamemodel
        defaultValues = "true".equals(defVal) && hasEditRightOnGameModel;

        if (modeParam != null) {
            try {
                this.mode = Mode.valueOf(modeParam.toUpperCase());
            } catch (IllegalArgumentException ex) {
                this.mode = Mode.PLAYER;
            }
        }

        if (!hasEditRightOnGameModel || mode == null) {
            this.mode = Mode.PLAYER;
        }

        includeInactive = "true".equals(inactiveParam) && hasEditRightOnGameModel;

        ResponseWriter writer = context.getResponseWriter();

        // Banner with GameModel name
        String subtitle;
        if (defaultValues) {
            subtitle = "Default";
        } else if (player.getUser() != null) {
            subtitle = player.getName();
        } else {
            subtitle = "Example";
        }

        // Header
        writer.write("<div class='header'>");
        writer.write("<div class='scenario'>");
        writer.write("<span class='title'>Scenario: </span>");
        writer.write("<span class='value'>" + gm.getName() + "</span>");
        writer.write("</div>");
        writer.write("<div class='team'>");
        writer.write("<span class='title'>Team: </span>");
        writer.write("<span class='value'>" + subtitle + "</span>");
        writer.write("</div>");
        writer.write("</div>");

        if (title == null || title.isEmpty()) {
            title = gm.getName();
        }

        UIHelper.printText(context, writer, title, UIHelper.CSS_CLASS_MAIN_TITLE);

        List<VariableDescriptor> vds;

        // unless root is specified, fetch all descriptors
        if (root == null || root.isEmpty()) {
            vds = gm.getChildVariableDescriptors();
        } else {
            vds = new ArrayList<>();
        }

        // links to subdirs
        UIHelper.startDiv(writer, UIHelper.CSS_CLASS_MENU, "menu");

        // replace with UI:Define from ListDescriptor Encode method in UIVariableDescriptor
        for (VariableDescriptor vd : vds) {
            if (vd instanceof ListDescriptor) {
                writer.write("<a href=\"#vd" + vd.getId() + "\" >" + vd.getLabel() + "</a>");
            }
        }
        UIHelper.endDiv(writer);

        ArrayList<String> path = new ArrayList<>();

        /*
         * when root is specified, do not print headers and start printing vardesc from root node
         */
        if (root == null || root.isEmpty()) {
            encodeGameModelHeader(context, writer, gm);
        } else {
            // Fetch all "root" descriptors
            VariableDescriptorFacade lookup = VariableDescriptorFacade.lookup();
            roots = root.split(",");

            try {
                for (String name : roots) {
                    VariableDescriptor find = lookup.find(gm, name);
                    vds.add(find);
                }

                if (roots.length == 1 && displayPath) {
                    // TODO extract common path
                    VariableDescriptor current = lookup.find(gm, root);
                    DescriptorListI parent;
                    while ((parent = current.getParent()) != null) {
                        if (parent instanceof GameModel) {
                            break;
                        } else {
                            current = (VariableDescriptor) parent;
                            path.add(getI18nFacade().interpolate(current.getLabel()
                                .translateOrEmpty(player), player));
                        }
                    }
                }
            } catch (WegasNoResultException ex) {
                logger.warn("Variable Not Found: " + ex);
            }
        }

        if (!path.isEmpty()) {
            UIHelper.startDiv(writer, UIHelper.CSS_CLASS_FOLDER);
            UIHelper
                .startSpan(writer, UIHelper.CSS_CLASS_VARIABLE_TITLE + "  wegas-pdf-listdescriptor");
            for (int i = path.size() - 1; i >= 0; i--) {
                writer.write(path.get(i));
                if (i > 0) {
                    writer.write(" / ");
                }
            }
            UIHelper.endSpan(writer);
        }

        for (VariableDescriptor vd : vds) {
            UIVariableDescriptor uiVd = new UIVariableDescriptor(vd, player, mode, defaultValues, includeInactive);
            uiVd.encodeAll(context);
        }

        if (!path.isEmpty()) {
            UIHelper.endDiv(writer);
        }

    }

    /**
     * Print GameModel own properties
     *
     * @param context
     * @param writer
     * @param gm
     *
     * @throws IOException
     */
    private void encodeGameModelHeader(FacesContext context, ResponseWriter writer, GameModel gm) throws IOException {
        UIHelper
            .printPropertyTextArea(context, writer, "Description", gm.getDescription(), false, mode == Mode.EDITOR);

        UIHelper.startSpan(writer, UIHelper.CSS_CLASS_MAIN_IMAGE);
        //HtmlGraphicImage image = new HtmlGraphicImage();
        //String imgSrc = "wegas-lobby/images/wegas-game-thumb.png";

        //image.setValue(imgSrc);
        //image.encodeAll(context);*/
        UIHelper.endSpan(writer);
    }
}
