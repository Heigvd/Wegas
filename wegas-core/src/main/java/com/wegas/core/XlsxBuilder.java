/*
* Wegas
* http://wegas.albasim.ch
*
* Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
* Licensed under the MIT License
 */
package com.wegas.core;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Calendar;
import java.util.Date;
import org.apache.poi.ss.usermodel.BuiltinFormats;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.RichTextString;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFFormulaEvaluator;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Create XLSX document easily
 *
 * @author maxence
 */
public class XlsxBuilder {

    private Workbook wb;

    private Sheet currentSheet;

    private Row currentRow;

    private int currentRowNumber;
    private int currentColumnNumber;

    /**
     * Create a new Workbook with a default sheet cursor at A1 cell.
     */
    public XlsxBuilder() {
        wb = new XSSFWorkbook();
        currentRowNumber = 0;
        currentColumnNumber = 0;
        currentSheet = wb.createSheet();
        currentRow = currentSheet.createRow(currentRowNumber);
    }

    /**
     * Create a new Workbook with a default named sheet cursor at A1 cell.
     *
     * @param sheetName name of the default sheet
     */
    public XlsxBuilder(String sheetName) {
        this();
        wb.setSheetName(0, sheetName);
    }

    /**
     * Add header style to the workbook. Such a style just defines bold font
     *
     * @return style with bold font
     */
    public CellStyle createHeaderStyle() {
        CellStyle style = wb.createCellStyle();

        Font headerFont = wb.createFont();
        headerFont.setBold(true);
        style.setFont(headerFont);

        return style;
    }

    /**
     * Add percent style to the workbook. Format number 0.15 as "15.00%"
     *
     * @return style to display percentage
     */
    public CellStyle createPercentStyle() {
        CellStyle style = wb.createCellStyle();
        style.setDataFormat(wb.createDataFormat()
                .getFormat(BuiltinFormats.getBuiltinFormat(10)));
        return style;
    }

    /**
     * Get the workbook
     *
     * @return the workbook
     */
    public Workbook getWorkbood() {
        return wb;
    }

    /**
     * Get the current row
     *
     * @return the current row
     */
    public final Row getCurrentRow() {
        return currentRow;
    }

    /**
     * Create a new row and set cursor to its first column
     *
     * @return the brand new row
     */
    public Row newRow() {
        currentRow = currentSheet.createRow(currentRowNumber);
        currentRowNumber++;
        currentColumnNumber = 0;
        return currentRow;
    }

    /**
     * Add a cell and move cursor to the next column
     *
     * @param style optional style
     * @return the brand new cell
     */
    public Cell addCell(CellStyle style) {
        Cell cell = getCurrentRow().createCell(currentColumnNumber);

        if (style != null) {
            cell.setCellStyle(style);
        }

        currentColumnNumber++;
        return cell;
    }

    /**
     * Move cursor to the next column
     */
    public void skipCell() {
        currentColumnNumber++;
    }

    /**
     * set current cell value and move cursor to the right
     *
     * @param value current cell value
     * @return the edited cell
     */
    public Cell addValue(Object value) {
        return this.addValue(value, null);
    }

    /**
     * set current cell value and move cursor to the right. set style if defined
     *
     * @param value current cell value
     * @param style optional style
     * @return the edited cell
     */
    public Cell addValue(Object value, CellStyle style) {
        Cell cell = this.addCell(style);

        if (value instanceof Calendar) {
            cell.setCellValue((Calendar) value);
        } else if (value instanceof Date) {
            cell.setCellValue((Date) value);
        } else if (value instanceof String) {
            cell.setCellValue((String) value);
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else if (value instanceof LocalDate) {
            cell.setCellValue((LocalDate) value);
        } else if (value instanceof LocalDateTime) {
            cell.setCellValue((LocalDateTime) value);
        } else if (value instanceof RichTextString) {
            cell.setCellValue((RichTextString) value);
        }

        return cell;
    }

    /**
     * set current cell formula and move cursor to the right.
     *
     * @param formula current cell formula
     * @return the edited cell
     */
    public Cell addFormnula(String formula) {
        return this.addFormnula(formula, null);
    }

    /**
     * set current cell formula and move cursor to the right. set style if defined
     *
     * @param formula current cell formula
     * @param style optional style
     * @return the edited cell
     */
    public Cell addFormnula(String formula, CellStyle style) {
        Cell cell = this.addCell(style);
        cell.setCellFormula(formula);

        XSSFFormulaEvaluator.evaluateAllFormulaCells(wb);

        return cell;
    }
}
