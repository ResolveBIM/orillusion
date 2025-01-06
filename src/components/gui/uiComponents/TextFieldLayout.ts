/// <summary>
///   <para>Where the anchor of the text is placed.</para>
/// </summary>

import { fonts } from "../../../assets/Fonts";
import { FontInfo } from "../../../loader/parser/FontParser";
import { GUIQuad } from "../core/GUIQuad";
import { UITextField } from "./UITextField";
import { UITransform } from "./UITransform";
import { WordWrapParams, WordWrapper } from "./WordWrapper";

export enum TextAnchor {
  /// <summary>
  ///   <para>Text is anchored in upper left corner.</para>
  /// </summary>
  UpperLeft,
  /// <summary>
  ///   <para>Text is anchored in upper side, centered horizontally.</para>
  /// </summary>
  UpperCenter,
  /// <summary>
  ///   <para>Text is anchored in upper right corner.</para>
  /// </summary>
  UpperRight,
  /// <summary>
  ///   <para>Text is anchored in left side, centered vertically.</para>
  /// </summary>
  MiddleLeft,
  /// <summary>
  ///   <para>Text is centered both horizontally and vertically.</para>
  /// </summary>
  MiddleCenter,
  /// <summary>
  ///   <para>Text is anchored in right side, centered vertically.</para>
  /// </summary>
  MiddleRight,
  /// <summary>
  ///   <para>Text is anchored in lower left corner.</para>
  /// </summary>
  LowerLeft,
  /// <summary>
  ///   <para>Text is anchored in lower side, centered horizontally.</para>
  /// </summary>
  LowerCenter,
  /// <summary>
  ///   <para>Text is anchored in lower right corner.</para>
  /// </summary>
  LowerRight,
}

export enum Vertical {
  Upper,
  Middle,
  Lower,
}

export enum Horizontal {
  Left,
  Center,
  Right,
}

export class TextFieldLine {
  public charList: string[] = [];
  public quadList: GUIQuad[] = [];
  public width: number = 0;
  public index: number = 0;
}

export class TextFieldLayout {

  public layout(target: UITextField): TextFieldLine[] {
    let lineList: TextFieldLine[] = [];

    let originSize = target.originSize;
    let fontData = fonts.getFontData(target.font, originSize);
    let realSize = target.fontSize / originSize;
    let realMaxWidth = target.widthRange ? target.widthRange[1] : target.uiTransform.width;
    let realMaxHeight = target.heightRange ? target.heightRange[1] : target.uiTransform.height;
    let { lineBreakChars, printedDelimiters, strippableDelimiters } = target;
    let wordWrapParams: WordWrapParams = { lineBreakChars, printedDelimiters, strippableDelimiters };

    let wrappedLines = this.wrapLinesAndFitToContent(
      target.text,
      target.uiTransform,
      target.font,
      target.originSize,
      target.fontSize,
      target.lineSpacing,
      wordWrapParams,
      target.hideOverflow,
      target.padding,
      target.widthRange,
      target.heightRange,
    );
    this.makeTextLine(target.uiTransform, target.alignment, lineList, target.font, fontData, wrappedLines, realSize, originSize, target.lineSpacing, target.padding);
    return lineList;
  }

  private wrapLinesAndFitToContent(
    text: string,
    transform: UITransform,
    fontName: string,
    originSize: number,
    fontSize: number,
    lineSpacing: number,
    wordWrapParams: WordWrapParams,
    hideOverflow: boolean,
    padding: number,
    widthRange?: [number, number],
    heightRange?: [number, number],
  ): string[] {
    let realMaxWidth = widthRange ? widthRange[1] : transform.width;
    let realMaxHeight = heightRange ? heightRange[1] : transform.height;
    let originSizeOverFontSize = originSize / fontSize;
    let maxTextWidthFontUnits = (realMaxWidth - 2 * padding) * originSizeOverFontSize;
    let maxTextHeightFontUnits = (realMaxHeight - 2 * padding) * originSizeOverFontSize;
    let maxLineCount: number = hideOverflow
      ? Math.floor(maxTextHeightFontUnits / (originSize * lineSpacing))
      : Infinity;

    let { wrappedLines, widestLineWidth } = new WordWrapper(
      fontName, originSize, maxTextWidthFontUnits, text, wordWrapParams
    );
    wrappedLines.splice(maxLineCount);

    // Resize to content if needed
    if (widthRange || heightRange) {
      const contentWidth = widestLineWidth * fontSize + 2 * padding;
      const contentHeight = wrappedLines.length * lineSpacing * fontSize + 2 * padding;
      const newWidth = widthRange ? Math.min(widthRange[1], contentWidth) : transform.width;
      const newHeight = heightRange ? Math.min(heightRange[1], contentHeight) : transform.height;
      transform.resize(newWidth, newHeight);
    }

    return wrappedLines;
  }

  private makeTextLine(
    transform: UITransform,
    alignment: TextAnchor,
    lineList: TextFieldLine[],
    fontName: string,
    fontData: FontInfo,
    wrappedLines: string[],
    realSize: number,
    originSize: number,
    lineSpacing: number,
    padding: number,
  ): void {
    let curLineIndex: number = -1;
    let offsetX = 0;

    let unitSize = originSize * realSize;
    let maxTextWidthReal = (transform.width - 2 * padding) / realSize;
    let maxTextHeightReal = (transform.height - 2 * padding) / realSize;

    let transformOffsetX = padding;
    let transformOffsetY = transform.height - padding;

    //new line
    let makeLine = (): TextFieldLine => {
      offsetX = 0;
      curLineIndex++;
      let line: TextFieldLine = new TextFieldLine();
      line.index = curLineIndex;
      lineList.push(line);
      return line;
    };

    //make quad by char code
    let makeQuad = (char: string, line: TextFieldLine): GUIQuad => {
      const code = char.charCodeAt(0).toString();
      let charSprite = fonts.getFnt(fontName, originSize, code);
      let quad: GUIQuad = null;
      if (charSprite) {
        quad = GUIQuad.spawnQuad();
        quad.sprite = charSprite;
        quad.x = (offsetX + charSprite.xoffset) * realSize + transformOffsetX;
        quad.y = (fontData.base - charSprite.height - charSprite.yoffset - fontData.base) * realSize + transformOffsetY;
        quad.width = charSprite.offsetSize.width * realSize;
        quad.height = charSprite.offsetSize.height * realSize;
      }
      offsetX += fonts.getXadvance(fontName, originSize, char, charSprite);
      line.width = offsetX;
      line.quadList.push(quad);
      line.charList.push(char);
      return quad;
    };

    //alignment
    let alignTextLine = (): void => {
      let tuple = this.getAlignment(alignment);

      switch (tuple.v) {
        case Vertical.Upper:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            if (i > 0) {
              let lineOffsetY = i * unitSize * lineSpacing;
              for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
                let quad = line.quadList[j];
                if (quad) {
                  quad.y -= lineOffsetY;
                }
              }
            }
          }
          break;
        case Vertical.Middle:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetY = (maxTextHeightReal - countI * originSize * lineSpacing) * 0.5 * realSize + i * unitSize * lineSpacing;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.y -= lineOffsetY;
              }
            }
          }
          break;
        case Vertical.Lower:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetY = (maxTextHeightReal - countI * originSize * lineSpacing) * realSize + i * unitSize * lineSpacing;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.y -= lineOffsetY;
              }
            }
          }
          break;
      }

      switch (tuple.h) {
        case Horizontal.Left:
          break;
        case Horizontal.Center:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetX = (maxTextWidthReal - line.width) * 0.5 * realSize;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.x += lineOffsetX;
              }
            }
          }
          break;
        case Horizontal.Right:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetX = (maxTextWidthReal - line.width) * realSize;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.x += lineOffsetX;
              }
            }
          }
          break;
      }
    };

    //Parse text
    let parseText = (): void => {
      let curLine: TextFieldLine = null;
      for (const textLine of wrappedLines) {
        curLine = makeLine();
        for (const char of textLine) {
          makeQuad(char, curLine);
        }
      }
    };

    parseText();
    alignTextLine();
  }

  private getAlignment(alignment: TextAnchor): { v: Vertical; h: Horizontal } {
    let ret: { v: Vertical; h: Horizontal } = { v: Vertical.Upper, h: Horizontal.Left };
    switch (alignment) {
      case TextAnchor.UpperCenter:
        ret.v = Vertical.Upper;
        ret.h = Horizontal.Center;
        break;
      case TextAnchor.UpperLeft:
        ret.v = Vertical.Upper;
        ret.h = Horizontal.Left;
        break;
      case TextAnchor.UpperRight:
        ret.v = Vertical.Upper;
        ret.h = Horizontal.Right;
        break;
      case TextAnchor.MiddleCenter:
        ret.v = Vertical.Middle;
        ret.h = Horizontal.Center;
        break;
      case TextAnchor.MiddleLeft:
        ret.v = Vertical.Middle;
        ret.h = Horizontal.Left;
        break;
      case TextAnchor.MiddleRight:
        ret.v = Vertical.Middle;
        ret.h = Horizontal.Right;
        break;
      case TextAnchor.LowerCenter:
        ret.v = Vertical.Lower;
        ret.h = Horizontal.Center;
        break;
      case TextAnchor.LowerLeft:
        ret.v = Vertical.Lower;
        ret.h = Horizontal.Left;
        break;
      case TextAnchor.LowerRight:
        ret.v = Vertical.Lower;
        ret.h = Horizontal.Right;
        break;
    }
    return ret;
  }
}
