


export function toResult(uri: string, data: any, error: any): any {
    if (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(error)
                }
            ],
            isError: true
        }
    }

    return {
        content: [{
            type: "resource",
            resource: [{
                uri,
                mimeType: "application/json",
                text: JSON.stringify(data)
            }],
        }]
    }
}

/**
 * Convert a JavaScript object to markdown format
 * @param data The data to convert to markdown
 * @returns Markdown formatted string
 */
export function toMarkdown(data: any, depth = 0): string {
    if (!data) return '';

    let markdown = '';
    const prefix = '#'.repeat(depth + 1);

    // Process the object
    for (const [key, value] of Object.entries(data)) {
        // Check if value is a primitive (string, number, boolean)
        if (value === null || value === undefined) {
            markdown += `${prefix} ${key}: null\n`;
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                markdown += `${prefix} ${key}: []\n`;
            } else if (typeof value[0] !== 'object' || value[0] === null) {
                // Rule 3: Array of primary values as a list
                markdown += `${prefix} ${key}\n`;
                value.forEach(item => {
                    markdown += `* ${item}\n`;
                });
            } else {
                // Rule 4: Array of objects as a table
                markdown += `${prefix} ${key}\n\n`;

                // Get all possible headers from all objects in the array
                const headers = new Set<string>();
                value.forEach(obj => {
                    if (obj && typeof obj === 'object') {
                        Object.keys(obj).forEach(header => headers.add(header));
                    }
                });

                // Create table header
                const headerArray = Array.from(headers);
                markdown += `| ${headerArray.join(' | ')} |\n`;
                markdown += `| ${headerArray.map(() => '---').join(' | ')} |\n`;

                // Add table rows
                value.forEach(obj => {
                    if (obj && typeof obj === 'object') {
                        const row = headerArray.map(header => {
                            const cellValue = obj[header];
                            if (cellValue === undefined || cellValue === null) return '';
                            if (typeof cellValue === 'object') return JSON.stringify(cellValue);
                            return cellValue;
                        }).join(' | ');
                        markdown += `| ${row} |\n`;
                    }
                });
                markdown += '\n';
            }
        } else if (typeof value !== 'object') {
            // Rule 1: First level properties of primary fields
            markdown += `${prefix} ${key}: ${value}\n`;
        } else {
            // Rule 2: Inner object
            markdown += `${prefix} ${key}\n`;

            markdown += toMarkdown(value, depth + 1);
        }
    }

    return markdown;
}
