import type { JSONContent } from '@tiptap/core';

export const RICH_CONTRIBUTION_PREFIX = 'sb-rich-v1:';

const WINDOWS_1252_BYTES: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function getWindows1252Byte(character: string): number | undefined {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) return undefined;
  return codePoint <= 0xff ? codePoint : WINDOWS_1252_BYTES[codePoint];
}

function decodeUtf8Sequence(bytes: number[]): string | null {
  const first = bytes[0];
  const length = first >= 0xc2 && first <= 0xdf ? 2
    : first >= 0xe0 && first <= 0xef ? 3
      : first >= 0xf0 && first <= 0xf4 ? 4
        : 0;
  if (length === 0 || bytes.length !== length) return null;

  let codePoint = first & (length === 2 ? 0x1f : length === 3 ? 0x0f : 0x07);
  for (let index = 1; index < length; index += 1) {
    const byte = bytes[index];
    if (byte < 0x80 || byte > 0xbf) return null;
    codePoint = (codePoint << 6) | (byte & 0x3f);
  }

  const minimum = length === 2 ? 0x80 : length === 3 ? 0x800 : 0x10000;
  if (codePoint < minimum || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
    return null;
  }
  return String.fromCodePoint(codePoint);
}

export function repairMojibake(value: string): string {
  let repaired = value;
  for (let pass = 0; pass < 2; pass += 1) {
    let result = '';
    let changed = false;
    for (let index = 0; index < repaired.length;) {
      const character = String.fromCodePoint(repaired.codePointAt(index)!);
      const firstByte = getWindows1252Byte(character);
      const sequenceLength = firstByte !== undefined && firstByte >= 0xc2 && firstByte <= 0xf4
        ? firstByte <= 0xdf ? 2 : firstByte <= 0xef ? 3 : 4
        : 0;
      if (sequenceLength > 0) {
        const sequence: number[] = [firstByte!];
        let nextIndex = index + character.length;
        while (sequence.length < sequenceLength && nextIndex < repaired.length) {
          const nextCharacter = String.fromCodePoint(repaired.codePointAt(nextIndex)!);
          const nextByte = getWindows1252Byte(nextCharacter);
          if (nextByte === undefined) break;
          sequence.push(nextByte);
          nextIndex += nextCharacter.length;
        }
        const decoded = decodeUtf8Sequence(sequence);
        if (decoded !== null) {
          result += decoded;
          index = nextIndex;
          changed = true;
          continue;
        }
      }
      result += character;
      index += character.length;
    }
    repaired = result;
    if (!changed) break;
  }
  return repaired;
}

export type ContributionTextAlign = 'left' | 'center' | 'right' | 'justify';

export interface ContributionTextMark {
  type: 'bold' | 'highlight';
}

export interface ContributionTextNode {
  type: 'doc' | 'paragraph' | 'text' | 'hardBreak';
  text?: string;
  marks?: ContributionTextMark[];
  attrs?: { textAlign?: ContributionTextAlign | null };
  content?: ContributionTextNode[];
}

function isContributionTextNode(value: unknown, depth = 0): value is ContributionTextNode {
  if (depth > 4 || typeof value !== 'object' || value === null || !('type' in value)) return false;

  const node = value as Record<string, unknown>;
  if (node.type === 'doc') {
    return depth === 0
      && Array.isArray(node.content)
      && node.content.every((child) => isContributionTextNode(child, depth + 1) && child.type === 'paragraph');
  }

  if (node.type === 'paragraph') {
    const align = typeof node.attrs === 'object' && node.attrs !== null && 'textAlign' in node.attrs
      ? node.attrs.textAlign
      : undefined;
    return Array.isArray(node.content)
      && (align === undefined || align === null || ['left', 'center', 'right', 'justify'].includes(String(align)))
      && node.content.every((child) => (
        isContributionTextNode(child, depth + 1) && (child.type === 'text' || child.type === 'hardBreak')
      ));
  }

  if (node.type === 'text') {
    return typeof node.text === 'string'
      && (node.marks === undefined || (
        Array.isArray(node.marks)
        && node.marks.every((mark) => (
          typeof mark === 'object'
          && mark !== null
          && 'type' in mark
          && (mark.type === 'bold' || mark.type === 'highlight')
        ))
      ));
  }

  return node.type === 'hardBreak';
}

export function getContributionDocument(content: string): ContributionTextNode | null {
  if (!content.startsWith(RICH_CONTRIBUTION_PREFIX)) return null;

  try {
    const document: unknown = JSON.parse(content.slice(RICH_CONTRIBUTION_PREFIX.length));
    return isContributionTextNode(document) ? document : null;
  } catch {
    return null;
  }
}

export function getContributionEditorDocument(content: string): JSONContent {
  const richDocument = getContributionDocument(content);
  if (richDocument) return richDocument as JSONContent;

  const paragraphs = content.replace(/\r\n?/g, '\n').split(/\n{2,}/).filter(Boolean);
  return {
    type: 'doc',
    content: (paragraphs.length > 0 ? paragraphs : ['']).map((paragraph) => ({
      type: 'paragraph',
      content: paragraph.split('\n').flatMap((line, index) => [
        index === 0
          ? (line ? { type: 'text', text: line } : null)
          : { type: 'hardBreak' },
        ...(index > 0 && line ? [{ type: 'text', text: line }] : []),
      ].filter((node) => node !== null)),
    })),
  };
}

export function encodeContributionDocument(document: JSONContent): string {
  return `${RICH_CONTRIBUTION_PREFIX}${JSON.stringify(document)}`;
}

export function getContributionPlainText(document: JSONContent): string {
  const paragraphs = Array.isArray(document.content) ? document.content : [];
  return paragraphs
    .map((paragraph) => {
      const nodes = Array.isArray(paragraph.content) ? paragraph.content : [];
      return nodes.map((node) => {
        if (node.type === 'hardBreak') return '\n';
        return node.type === 'text' ? node.text ?? '' : '';
      }).join('');
    })
    .join('\n\n')
    .trim();
}

export function appendPlainTextToContributionDocument(
  document: JSONContent,
  text: string,
): JSONContent {
  const addition = getContributionEditorDocument(text);
  const existingText = getContributionPlainText(document);
  return {
    type: 'doc',
    content: [
      ...(existingText ? document.content ?? [] : []),
      ...(addition.content ?? []),
    ],
  };
}
