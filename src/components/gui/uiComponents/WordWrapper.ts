import { fonts } from "../../../assets/Fonts";

const CHAR_TYPES = {
  LINE_BREAK: 0,
  PRINTED_DELIMITER: 1,
  STRIPPABLE_DELIMITER: 2,
  WORD: 3,
} as const;

export type WordWrapParams = {
  lineBreakChars: string,
  printedDelimiters: string,
  strippableDelimiters: string
};

export class WordWrapper {
  public readonly font: string;
  public readonly originSize: number;
  public readonly printedDelimiters: string = ' -';
  public readonly lineBreakChars: string = '\n';
  public readonly strippableDelimiters: string = ' \t';
  private _text: string;
  private _maxWidth: number;
  private _wrappedLines: string[];
  private _widestLineWidth: number;

  constructor(
    font: string,
    originSize: number,
    maxWidth: number = Infinity,
    text: string = '',
    {
      lineBreakChars,
      printedDelimiters,
      strippableDelimiters,
    }: WordWrapParams,
  ) {
    this.font = font;
    this.originSize = originSize;
    this.printedDelimiters = printedDelimiters;
    this.lineBreakChars = lineBreakChars;
    this.strippableDelimiters = strippableDelimiters;
    this._maxWidth = maxWidth;
    this._text = text;
    this.wrap();
  }

  public get wrappedLines(): string[] {
    return this._wrappedLines;
  }

  /**
   * Get widest line width in units of line height
   */
  public get widestLineWidth(): number {
    return this._widestLineWidth / this.originSize;
  }

  public get text(): string {
    return this._text;
  }

  public set text(value: string) {
    this._text = value;
    this.wrap();
  }

  public get maxWidth(): number {
    return this._maxWidth;
  }

  public set maxWidth(value: number) {
    this._maxWidth = value;
    this.wrap();
  }

  private wrap(): void {
    const { _wrappedLines, _text, _maxWidth, font, originSize } = this;
    const wrapState = new WrapState(_text, _maxWidth);
    let i = 0;

    for (; i < _text.length; i++) {
      const char = _text.charAt(i);
      const charWidth = fonts.getXadvance(font, originSize, char);
      const charType = this.getCharType(char);

      switch (charType) {
        case CHAR_TYPES.LINE_BREAK:
          wrapState.handleLineBreak(i);
          break;
        case CHAR_TYPES.PRINTED_DELIMITER:
          wrapState.handlePrintingDelim(i, charWidth);
          break;
        case CHAR_TYPES.STRIPPABLE_DELIMITER:
          wrapState.handleStrippableDelim(i, charWidth);
          break;
        case CHAR_TYPES.WORD:
          wrapState.handlePrintingChar(i, charWidth);
          break;
      }
    }

    wrapState.handleEnd(i);
    this._wrappedLines = wrapState.lines;
    this._widestLineWidth = wrapState.widestLineWidth;
  }

  private getCharType(char: string): typeof CHAR_TYPES[keyof typeof CHAR_TYPES] {
    const { printedDelimiters, lineBreakChars, strippableDelimiters } = this;
    if (lineBreakChars.includes(char)) {
      return CHAR_TYPES.LINE_BREAK;
    }
    if (printedDelimiters.includes(char)) {
      return CHAR_TYPES.PRINTED_DELIMITER;
    }
    if (strippableDelimiters.includes(char)) {
      return CHAR_TYPES.STRIPPABLE_DELIMITER;
    }
    return CHAR_TYPES.WORD;
  }
}

class WrapState {
  public text: string;
  public maxWidth: number;
  public lines: string[];
  public lineStart: number;
  public lineEnd: number;
  public lineWidth: number;
  public lastLineWrapped: boolean;
  public inFirstWordOfLine: boolean;
  public strippableDelimWidth: number;
  public wordStart?: number;
  public wordWidth: number;
  public widestLineWidth: number;

  constructor(text: string, maxWidth: number) {
    this.lines = [];
    this.reset(text, maxWidth);
  }

  public reset(text: string, maxWidth: number): void {
    this.text = text;
    this.maxWidth = maxWidth;
    this.lines.splice(0);
    this.lineStart = 0;
    this.lineEnd = 0;
    this.lineWidth = 0;
    this.lastLineWrapped = false;
    this.inFirstWordOfLine = true;
    this.strippableDelimWidth = 0;
    this.wordStart = undefined;
    this.wordWidth = 0;
    this.widestLineWidth = 0;
  }

  public get inWord(): boolean {
    return this.wordStart !== undefined;
  }

  public get lineWidthWithCurrentWord(): number {
    if (this.inFirstWordOfLine) {
      return this.wordWidth;
    }
    return this.lineWidth + this.strippableDelimWidth + this.wordWidth;
  }

  public flushLine(wrapped: boolean): void {
    const line = this.text.substring(this.lineStart, this.lineEnd);
    this.lines.push(line);
    this.lineStart = this.lineEnd;
    this.widestLineWidth = Math.max(this.widestLineWidth, this.lineWidth);
    this.lineWidth = 0;
    this.lastLineWrapped = wrapped;
    this.inFirstWordOfLine = true;
  }

  public flushWord(newWordEnd: number): void {
    this.lineWidth = this.lineWidthWithCurrentWord;
    if (this.inFirstWordOfLine) {
      this.lineStart = this.wordStart;
    }
    this.lineEnd = newWordEnd;
    this.wordWidth = 0;
    this.strippableDelimWidth = 0;
    this.inFirstWordOfLine = false;
    this.wordStart = undefined;
  }

  public handleLineBreak(i: number) {
    this.flushWord(i);
    this.flushLine(false);
    this.lineStart = i + 1;
  }

  public handlePrintingChar(i: number, width: number): void {
    if (this.lineWidthWithCurrentWord + width > this.maxWidth) {
      if (this.inFirstWordOfLine) {
        this.flushWord(i);
      }
      this.flushLine(true);
    }
    if (!this.inWord) {
      this.wordStart = i;
    }
    this.wordWidth += width;
  }

  public handlePrintingDelim(i: number, width: number): void {
    this.handlePrintingChar(i, width);
    this.flushWord(i + 1);
  }

  public handleStrippableDelim(i: number, width: number): void {
    if (this.inWord) {
      this.flushWord(i);
    }
    this.strippableDelimWidth += width;
  }

  public handleEnd(i): void {
    if (this.inWord) {
      this.flushWord(i);
    }
    this.flushLine(false);
  }
}
