/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.admin;

import com.wegas.helper.StaticHelper;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Set;
import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author maxence
 */
public class AdminServlet extends HttpServlet {


    private static final String BEGIN_SCRIPT_TAG = "<script type='text/javascript'>\n";
    private static final String END_SCRIPT_TAG = "</script>\n";

    /** 
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code> methods.
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request,
                                  HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        try {
         /*   HashMap<Integer, DispatchTransaction> transactions = dispatcher.getTransactions();

            out.println("<h1>Transaction</h1>");
            out.println("<ul>");

            for (Integer key : transactions.keySet()) {
                DispatchTransaction dt = transactions.get(key);
                out.println("<li>");
                out.println(key);
                out.println(": ");
                out.println(dt.getTerminal().getCometHandler());
                out.println("</li>");
            }

            out.println("</ul>");

            out.println("<h1>COMET clients</h1>");

            out.println("<table>");

            Set<Terminal> terminals = dispatcher.getTerminals();

            Iterator<Terminal> iterator = terminals.iterator();
            while (iterator.hasNext()) {
                Terminal next = iterator.next();
                out.println("<tr><td>" + next + "</td><td>" + next.getCometHandler() + "</td></tr>");
            }
            out.println("</table>");
            // TODO output your page here
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet AdminServlet</title>");
            out.println("</head>");
            out.println("<body>");
            out.println("<h1>Servlet AdminServlet at " + request.getContextPath () + "</h1>");
            out.println("</body>");
            out.println("</html>");
             

            String action = request.getParameter("action");

            if (action != null) {
                if (action.equalsIgnoreCase("reset")) {
                    dispatcher.reset();
                } else if (action.equalsIgnoreCase("notify")) {
                    CometContext context = CometEngine.getEngine().register("/Wegas-9999/cs");
                    String script = BEGIN_SCRIPT_TAG + 
                            "window.parent.app.update({ name: \"" +
                            StaticHelper.escape("welcome") + 
                            "\", message: \"" + 
                            StaticHelper.escape("Welcome buddy!") + 
                            "\" });\n" + 
                            END_SCRIPT_TAG;
                    context.notify(script);
                }
            }


             */
        } finally {
            out.close();
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">

    /** 
     * Handles the HTTP <code>GET</code> method.
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }


    /** 
     * Handles the HTTP <code>POST</code> method.
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }


    /** 
     * Returns a short description of the servlet.
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>


}
