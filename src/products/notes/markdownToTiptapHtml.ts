const HEADING_LINE = /^(#{1,6})\s+(.*)$/;
const BULLET_LINE = /^[-*+]\s+(.*)$/;
const ORDERED_LINE = /^\d+\.\s+(.*)$/;
const BLOCKQUOTE_LINE = /^>\s?(.*)$/;
const CODE_FENCE_LINE = /^```/;
const TABLE_ROW_LINE = /^\s*\|.*\|\s*$/;
// The |---|:---:| row under a header — what separates a table from prose that happens to contain pipes.
const TABLE_DELIMITER_LINE = /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/;

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
    const escaped = escapeHtml(text);
    // Inline code first so `**not bold**` inside backticks stays literal.
    const withCode = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    const withBold = withCode.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return withBold.replace(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/g, (_match, star, underscore) => {
        const content = star ?? underscore;
        return `<em>${content}</em>`;
    });
}

function renderList(items: string[], tag: 'ul' | 'ol'): string {
    const listItems = items.map((item) => `<li><p>${renderInline(item)}</p></li>`).join('');
    return `<${tag}>${listItems}</${tag}>`;
}

function splitTableRowCells(line: string): string[] {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
}

function renderTableRow(cells: string[], cellTag: 'th' | 'td'): string {
    // Tiptap's table schema puts a paragraph inside every cell, same as list items.
    const rowCells = cells.map((cell) => `<${cellTag}><p>${renderInline(cell)}</p></${cellTag}>`).join('');
    return `<tr>${rowCells}</tr>`;
}

/**
 * Converts a fixed subset of markdown to HTML — only the node/mark types this
 * app's Tiptap schema (StarterKit + tables) actually renders: heading, bold,
 * italic, inline code, code block, blockquote, bullet/ordered list, table.
 * Not a general-purpose markdown renderer — intentionally narrower.
 */
export function markdownToTiptapHtml(markdown: string): string {
    const lines = markdown.split('\n');
    const htmlBlocks: string[] = [];

    let index = 0;
    // Every line is read through here. With noUncheckedIndexedAccess an indexed
    // read is string | undefined, and the loop guards already keep index in range,
    // so saying that once beats an assertion at every use.
    const lineAt = (position: number): string => lines[position] ?? '';

    while (index < lines.length) {
        const line = lineAt(index);

        if (line.trim() === '') {
            index++;
            continue;
        }

        if (CODE_FENCE_LINE.test(line)) {
            const codeLines: string[] = [];
            index++;
            while (index < lines.length && !CODE_FENCE_LINE.test(lineAt(index))) {
                codeLines.push(lineAt(index));
                index++;
            }
            index++; // skip closing fence
            htmlBlocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
            continue;
        }

        const headingMatch = line.match(HEADING_LINE);
        if (headingMatch) {
            const level = (headingMatch[1] ?? '#').length;
            htmlBlocks.push(`<h${level}>${renderInline(headingMatch[2] ?? '')}</h${level}>`);
            index++;
            continue;
        }

        if (BULLET_LINE.test(line)) {
            const items: string[] = [];
            while (index < lines.length && BULLET_LINE.test(lineAt(index))) {
                items.push(lineAt(index).match(BULLET_LINE)?.[1] ?? '');
                index++;
            }
            htmlBlocks.push(renderList(items, 'ul'));
            continue;
        }

        if (ORDERED_LINE.test(line)) {
            const items: string[] = [];
            while (index < lines.length && ORDERED_LINE.test(lineAt(index))) {
                items.push(lineAt(index).match(ORDERED_LINE)?.[1] ?? '');
                index++;
            }
            htmlBlocks.push(renderList(items, 'ol'));
            continue;
        }

        if (BLOCKQUOTE_LINE.test(line)) {
            const quoteLines: string[] = [];
            while (index < lines.length && BLOCKQUOTE_LINE.test(lineAt(index))) {
                quoteLines.push(lineAt(index).match(BLOCKQUOTE_LINE)?.[1] ?? '');
                index++;
            }
            htmlBlocks.push(`<blockquote><p>${renderInline(quoteLines.join(' '))}</p></blockquote>`);
            continue;
        }

        if (TABLE_ROW_LINE.test(line) && TABLE_DELIMITER_LINE.test(lineAt(index + 1))) {
            const headerCells = splitTableRowCells(line);
            const tableRows: string[] = [renderTableRow(headerCells, 'th')];
            index += 2; // header + delimiter
            while (index < lines.length && TABLE_ROW_LINE.test(lineAt(index))) {
                // GFM: rows are squared to the header's width — extra cells are
                // dropped, missing ones filled in empty.
                const bodyCells = splitTableRowCells(lineAt(index)).slice(0, headerCells.length);
                while (bodyCells.length < headerCells.length) {
                    bodyCells.push('');
                }
                tableRows.push(renderTableRow(bodyCells, 'td'));
                index++;
            }
            htmlBlocks.push(`<table><tbody>${tableRows.join('')}</tbody></table>`);
            continue;
        }

        const paragraphLines: string[] = [line];
        index++;
        while (
            index < lines.length &&
            lineAt(index).trim() !== '' &&
            !HEADING_LINE.test(lineAt(index)) &&
            !BULLET_LINE.test(lineAt(index)) &&
            !ORDERED_LINE.test(lineAt(index)) &&
            !BLOCKQUOTE_LINE.test(lineAt(index)) &&
            !CODE_FENCE_LINE.test(lineAt(index)) &&
            !TABLE_ROW_LINE.test(lineAt(index))
        ) {
            paragraphLines.push(lineAt(index));
            index++;
        }
        htmlBlocks.push(`<p>${renderInline(paragraphLines.join(' '))}</p>`);
    }

    return htmlBlocks.join('');
}

const MARKDOWN_LINE_PATTERN = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s?|```|\s*\|.*\|\s*$)/m;
const SEMANTIC_HTML_PATTERN = /<(h[1-6]|ul|ol|strong|em|blockquote|pre|code)\b/i;

/**
 * Returns the plain-text markdown from a paste event's clipboard data, or
 * null if the paste isn't markdown-like plain text (e.g. it's a rich paste
 * that already carries real HTML markup, which should be left to Tiptap's
 * default paste handling).
 */
export function extractMarkdownFromClipboard(clipboardData: DataTransfer): string | null {
    const text = clipboardData.getData('text/plain');
    if (!text || !MARKDOWN_LINE_PATTERN.test(text)) return null;

    const html = clipboardData.getData('text/html');
    if (html && SEMANTIC_HTML_PATTERN.test(html)) return null;

    return text;
}
