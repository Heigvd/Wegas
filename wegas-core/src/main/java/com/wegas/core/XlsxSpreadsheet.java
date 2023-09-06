/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.rest.util.JacksonMapperProvider;
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
import org.graalvm.polyglot.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Create XLSX document easily
 *
 * @author maxence
 */
public class XlsxSpreadsheet {

    private static final Logger logger = LoggerFactory.getLogger(XlsxSpreadsheet.class);

    private Workbook wb;

    private Sheet currentSheet;

    private Row currentRow;

    private int currentRowNumber;
    private int currentColumnNumber;
    private int maxColumn;

    private CellStyle defaultDateStyle;

    /**
     * Create a new Workbook with a default sheet cursor at A1 cell.
     */
    public XlsxSpreadsheet() {
        wb = new XSSFWorkbook();
    }

    /**
     * Add header style to the workbook. Such a style just defines bold font
     *
     * @return style with bold font
     */
    public CellStyle createHeaderStyle() {
        CellStyle style = wb.createCellStyle();

        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);

        return style;
    }

    public CellStyle createSmallerHeaderStyle() {
        CellStyle style = wb.createCellStyle();

        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);

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
     * Add date style to the workbook: DD/MMM/YYYY HH:MM:SS
     *
     * @return style to display percentage
     */
    public CellStyle createDateStyle() {
        CellStyle style = wb.createCellStyle();
        style.setDataFormat(wb.createDataFormat().getFormat("DD/MMM/YYYY HH:MM:SS"));
        return style;
    }

    private CellStyle getDefaultDateStyle() {
        if (this.defaultDateStyle == null) {
            this.defaultDateStyle = createDateStyle();
        }
        return this.defaultDateStyle;
    }

    /**
     * Get the workbook
     *
     * @return the workbook
     */
    public Workbook getWorkbood() {
        return wb;
    }

    public Sheet getCurrentSheet() {
        return currentSheet;
    }

    /**
     * Get the current row
     *
     * @return the current row
     */
    public final Row getCurrentRow() {
        return currentRow;
    }

    public Sheet addSheet(String sheetName) {
        this.maxColumn = 0;
        this.currentRowNumber = 0;
        this.currentColumnNumber = 0;
        if (sheetName != null) {
            this.currentSheet = wb.createSheet(sheetName);
        } else {
            this.currentSheet = wb.createSheet();
        }
        this.currentRow = currentSheet.createRow(currentRowNumber);

        return currentSheet;
    }

    /**
     * Create a new row and set cursor to its first column
     *
     * @return the brand new row
     */
    public Row newRow() {
        currentRowNumber++;
        currentRow = currentSheet.createRow(currentRowNumber);
        currentColumnNumber = 0;
        return currentRow;
    }

    /**
     * Add a cell and move cursor to the next column
     *
     * @param style optional style
     *
     * @return the brand new cell
     */
    public Cell addCell(CellStyle style) {
        Cell cell = getCurrentRow().createCell(currentColumnNumber);

        if (style != null) {
            cell.setCellStyle(style);
        }

        skipCell();
        return cell;
    }

    /**
     * Move cursor to the next column
     */
    public void skipCell() {
        currentColumnNumber++;
        this.maxColumn = Math.max(maxColumn, currentColumnNumber);
    }

    /**
     * set current cell value and move cursor to the right
     *
     * @param value current cell value
     *
     * @return the edited cell
     */
    public Cell addValue(Object value) {
        return this.addValue(value, null);
    }

    /**
     * set current cell value and move cursor to the right. set style if defined
     *
     * @param oValue current cell value
     * @param style  optional style
     *
     * @return the edited cell
     */
    public Cell addValue(Object value, CellStyle style) {
        Cell cell = this.addCell(style);

        if (value instanceof String) {
            try {
                cell.setCellValue(Double.parseDouble((String) value));
            } catch (NumberFormatException ex) {
                String v = (String) value;
                if (v.length() >= 32767) {
                    v = v.substring(0, 32767);
                }
                cell.setCellValue(v);
            }
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Calendar) {
            cell.setCellValue((Calendar) value);
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else if (value instanceof Date) {
            cell.setCellValue((Date) value);
            setDateStyle(cell, style);
        } else if (value instanceof LocalDate) {
            cell.setCellValue((LocalDate) value);
            setDateStyle(cell, style);
        } else if (value instanceof LocalDateTime) {
            cell.setCellValue((LocalDateTime) value);
            setDateStyle(cell, style);
        } else if (value instanceof RichTextString) {
            cell.setCellValue((RichTextString) value);
            setDateStyle(cell, style);
        } else if (value instanceof Value jsObject) {
            // first attemps: pretty print simple object
            StringBuilder content = new StringBuilder();
            boolean failed = false;

            for (String key : jsObject.getMemberKeys()) {
                Object member = jsObject.getMember(key);
                if (member != null) {
                    if (member instanceof Number) {
                        content.append(key).append(": ").append(((Number) member).doubleValue());
                    } else if (member instanceof CharSequence) {
                        content.append(key).append(": ").append(((CharSequence) member));
                    } else {
                        logger.error("Unhandled object member (k: {}): {}", key, member);
                        failed = true;
                        break;
                    }
                    content.append(System.lineSeparator());
                }
            }
            if (!failed) {
                cell.setCellValue(content.toString());
            } else {
                // not possible? so serialize whole object
                ObjectMapper mapper = JacksonMapperProvider.getMapper();
                try {
                    String asString = mapper.writeValueAsString(value);
                    cell.setCellValue(asString);
                } catch (JsonProcessingException ex) {
                    logger.error("Stringify JsObject fails");
                }
            }
        } else {
            logger.error("Unhandled value: {} ", value);
        }

        return cell;
    }

    private void setDateStyle(Cell cell, CellStyle userStyle) {
        if (userStyle == null) {
            cell.setCellStyle(this.getDefaultDateStyle());
        }
    }

    /**
     * set current cell formula and move cursor to the right.
     *
     * @param formula current cell formula
     *
     * @return the edited cell
     */
    public Cell addFormnula(String formula) {
        return this.addFormnula(formula, null);
    }

    /**
     * set current cell formula and move cursor to the right. set style if defined
     *
     * @param formula current cell formula
     * @param style   optional style
     *
     * @return the edited cell
     */
    public Cell addFormnula(String formula, CellStyle style) {
        Cell cell = this.addCell(style);
        cell.setCellFormula(formula);

        XSSFFormulaEvaluator.evaluateAllFormulaCells(wb);

        return cell;
    }

    public void autoWidth() {
        for (int i = 0; i <= this.maxColumn; i++) {
            /*
             * autoSizeColumn does not work on openJDK server version (requires awt Font config...)
             */
            //this.currentSheet.autoSizeColumn(i);
        }
    }

    public int getCurrentColumnNumber() {
        return this.currentColumnNumber;
    }

    public int getCurrentRowNumber() {
        return currentRowNumber;
    }

    public void setCurrentRowNumber(int currentRowNumber) {
        this.currentRowNumber = currentRowNumber;
    }

    public void setCurrentColumnNumber(int currentColumnNumber) {
        this.currentColumnNumber = currentColumnNumber;
    }

    public int getMaxColumn() {
        return maxColumn;
    }
}
