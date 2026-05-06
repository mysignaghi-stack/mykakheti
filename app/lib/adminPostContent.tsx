import React from 'react';

type ContentSegment = {
  text: string;
  color: string | null;
};

const COLOR_TAG = '[[color:';
const COLOR_CLOSE = '[[/color]]';

const isValidColor = (value: string) => /^#[0-9a-fA-F]{3,8}$/.test(value);

export const stripAdminPostContent = (content: string) => (
  content
    .replace(/\[\[color:[^\]]+\]\]/g, '')
    .replace(/\[\[\/color\]\]/g, '')
);

const parseAdminPostContent = (content: string): ContentSegment[] => {
  const segments: ContentSegment[] = [];
  let cursor = 0;
  let currentColor: string | null = null;

  while (cursor < content.length) {
    const nextOpen = content.indexOf(COLOR_TAG, cursor);
    const nextClose = content.indexOf(COLOR_CLOSE, cursor);
    const hasOpen = nextOpen !== -1;
    const hasClose = nextClose !== -1;

    let nextIndex = -1;
    let isOpen = false;

    if (hasOpen && hasClose) {
      if (nextOpen < nextClose) {
        nextIndex = nextOpen;
        isOpen = true;
      } else {
        nextIndex = nextClose;
      }
    } else if (hasOpen) {
      nextIndex = nextOpen;
      isOpen = true;
    } else if (hasClose) {
      nextIndex = nextClose;
    }

    if (nextIndex === -1) {
      segments.push({ text: content.slice(cursor), color: currentColor });
      break;
    }

    if (nextIndex > cursor) {
      segments.push({ text: content.slice(cursor, nextIndex), color: currentColor });
    }

    if (isOpen) {
      const end = content.indexOf(']]', nextIndex + COLOR_TAG.length);
      if (end === -1) {
        segments.push({ text: content.slice(nextIndex), color: currentColor });
        break;
      }
      const colorValue = content.slice(nextIndex + COLOR_TAG.length, end);
      if (isValidColor(colorValue)) {
        currentColor = colorValue;
        cursor = end + 2;
      } else {
        segments.push({ text: content.slice(nextIndex, end + 2), color: currentColor });
        cursor = end + 2;
      }
    } else {
      currentColor = null;
      cursor = nextIndex + COLOR_CLOSE.length;
    }
  }

  return segments;
};

export const renderAdminPostContent = (content: string) => {
  const safeContent = content ?? '';
  const segments = parseAdminPostContent(safeContent);
  const nodes: React.ReactNode[] = [];

  segments.forEach((segment, segmentIndex) => {
    const parts = segment.text.split('\n');
    parts.forEach((part, partIndex) => {
      if (part.length > 0) {
        nodes.push(
          <span key={`seg-${segmentIndex}-${partIndex}`} style={segment.color ? { color: segment.color } : undefined}>
            {part}
          </span>
        );
      }
      if (partIndex < parts.length - 1) {
        nodes.push(<br key={`br-${segmentIndex}-${partIndex}`} />);
      }
    });
  });

  return nodes;
};
