/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Converts Snowflake JSON results into a Markdown table.
 * @param {object} responseJson - The Snowflake SQL ExecutionResponse.
 * @returns {string} A Markdown string representing the data.
 */
export function convertSnowflakeTableDataToMarkdown(tableData: any): string {
    // Handle both old and new API format
    const metaData = tableData.resultSetMetaData || tableData.result_set?.resultSetMetaData;
    const data = tableData.data || tableData.result_set?.data;
    
    if (!metaData || !data) {
        console.warn("Invalid table data structure:", tableData);
        return "| Error | \n| --- |\n| Invalid table data |";
    }

    // Extract column names
    const columns = metaData.rowType.map((colDef: any) => colDef.name);

    // Prepare table header in Markdown
    // e.g. | COL1 | COL2 | ... |
    let markdown = `| ${columns.join(' | ')} |\n`;

    // Prepare the header separator row in Markdown
    // e.g. | --- | --- | ... |
    markdown += `| ${columns.map(() => '---').join(' | ')} |\n`;

    // Build table rows
    // data is an array of arrays, e.g. [ [val1, val2], [val3, val4], ... ]
    data.forEach((row: any) => {
        const rowValues = row.map((val: any) => (val == null ? '' : val));
        markdown += `| ${rowValues.join(' | ')} |\n`;
    });

    return markdown;
}
