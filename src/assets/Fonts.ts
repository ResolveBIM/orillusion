import { GUISprite } from "../components/gui/core/GUISprite";
import { FontInfo } from "../loader/parser/FontParser";

class Fonts {
    protected fntCache: { [key: number]: { [key: string]: GUISprite } } = {};
    protected fntData: { [key: number]: { [key: string]: FontInfo } } = {};

    addFontData(face: string, size: number, fontData: FontInfo) {
        this.fntData[`${face}${size}`] = fontData;
    }

    getFontData(face: string, size: number): FontInfo {
        return this.fntData[`${face}${size}`];
    }

    addFnt(font: string, size: number, id: string, sprite: GUISprite) {
        let key = `${font}${size}`;
        if (!this.fntCache[key]) this.fntCache[key] = {};
        this.fntCache[key][id] = sprite;
    }

    getFnt(font: string, size: number, id: string): GUISprite {
        let key = `${font}${size}`;
        let list = this.fntCache[key];
        return list ? list[id] : this.fntCache[` `];
    }

    getXadvance(font: string, size: number, char: string, charSprite?: GUISprite): number {
        let sprite = charSprite || this.getFnt(font, size, char.charCodeAt(0).toString());
        return sprite
            ? sprite.xadvance
            : char === '\n'
            ? 0
            : char === '\t'
            ? size
            : size * 0.5;
    }

    /**
     * Wrap text to fit within a certain width.
     *
     * @param font The name of the font as specified in its `.fnt` file.
     * @param size The native size of the font as specified in its `.fnt` file.
     * @param maxWidth The maximum width of a line of text, with width given in the same
     * units as the `size`.
     * @param text The text to wrap.
     * @param options Options for word wrapping.
     * @param options.wordWrapDelimiters Characters that can be used to end a line of text. Will
     * try to start a new line immediately after one of these characters if possible.
     * @param options.lineBreakChars Characters that can be used to end a line of text. These
     * will cause a new line and will not be included in the output.
     * @param options.stripLeadingWhitespace Characters that will be stripped from the beginning of
     * new lines, e.g. whitespace.
     */
    wordWrap(
        font: string,
        size: number,
        maxWidth: number,
        text: string,
        {
            wordWrapDelimiters = ' -',
            lineBreakChars = '\n',
            stripLeadingWhitespace = ' '
        }: { wordWrapDelimiters?: string, lineBreakChars?: string, stripLeadingWhitespace?: string } = {}
    ): string[] {
        let outputLines = [];
        let lineStart = 0;
        let lastDelimIndex = -1;
        let lineWidth = 0;
        let i = 0;

        console.log('wrapping');

        const flushCurrentLine = () => {
            let lastLine = text.substring(lineStart, lastDelimIndex + 1);
            console.log("FLUSHING", i, lineStart, lastDelimIndex, lastLine);
            outputLines.push(lastLine);
            lineStart = lastDelimIndex + 1;
            lineWidth = 0;
            // Strip leading whitespace
            while (stripLeadingWhitespace.includes(text[lineStart])) {
                console.log("SKIPPING CHAR");
                i = lastDelimIndex = lineStart;
                lineStart = i + 1;
            }
        }

        for (; i < text.length; i++) {
            let char = text.charAt(i);
            console.log('CHAR:', char);

            // Handle existing line breaks
            if (lineBreakChars.includes(char)) {
                console.log("LINE BREAK CHAR");
                lastDelimIndex = i - 1;
                flushCurrentLine();
                continue;
            }

            // Delimiters mark where we can end a line
            if (wordWrapDelimiters.includes(char)) {
                console.log("DELIM CHAR");
                lastDelimIndex = i;
            }
            lineWidth += this.getXadvance(font, size, char);
            console.log("LINE WIDTH:", lineWidth);

            // Insert a line break if the line is too long
            if (lineWidth > maxWidth) {
                console.log("TOO LONG", i, lineStart, lastDelimIndex);;
                // If the line is just a single character, it won't fit anyway, so add it
                // and start a new line. If it's just a single word, force it to wrap and
                // start a new line.
                if (i === lineStart) {
                    console.log("FORCE INCLUDE SINGLE CHAR");
                    lastDelimIndex = i;
                } else if (lastDelimIndex < lineStart) {
                    console.log("FORCE INCLUDE PARTIAL WORD");
                    i--;
                    lastDelimIndex = i;
                }
                flushCurrentLine();
                continue;
            }
        }

        // Flush remaining characters
        flushCurrentLine();
        return outputLines;
    }
}

export let fonts: Fonts = new Fonts();
