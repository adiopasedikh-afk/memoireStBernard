'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import HardBreak from '@tiptap/extension-hard-break';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import type { MouseEventHandler, ReactNode } from 'react';

interface ContributionRichTextEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  label: string;
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

function ToolbarButton({ label, children, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-slate-600 px-2.5 py-1 text-sm text-slate-100 hover:border-amber-400 hover:text-amber-300 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

const extensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  HardBreak,
  Highlight.configure({ multicolor: false }),
  TextAlign.configure({
    types: ['paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
    defaultAlignment: null,
  }),
];

export default function ContributionRichTextEditor({
  content,
  onChange,
  disabled = false,
}: ContributionRichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
    editorProps: {
      attributes: {
        class: 'min-h-56 rounded-b-lg bg-slate-950 px-3 py-3 text-sm text-white outline-none [&_p]:my-2 [&_mark]:rounded [&_mark]:bg-yellow-300 [&_mark]:px-0.5 [&_mark]:text-slate-950',
        'aria-label': 'Texte mis en forme de la contribution',
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700">
      <div role="toolbar" aria-label="Mise en forme du texte" className="flex flex-wrap gap-2 border-b border-slate-700 bg-slate-900 p-2">
        <ToolbarButton
          label="Gras"
          disabled={!editor || disabled}
          onClick={() => {
            editor?.chain().focus().toggleBold().run();
          }}
        >
          <strong>G</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Surligner"
          disabled={!editor || disabled}
          onClick={() => {
            editor?.chain().focus().toggleHighlight().run();
          }}
        >
          <span className="rounded bg-yellow-300 px-1 text-slate-950">S</span>
        </ToolbarButton>
        <span aria-hidden="true" className="mx-1 border-l border-slate-700" />
        {([
          ['left', 'Aligner à gauche', '≡'],
          ['center', 'Centrer', '≡'],
          ['right', 'Aligner à droite', '≡'],
          ['justify', 'Justifier', '☰'],
        ] as const).map(([alignment, label, icon]) => (
          <ToolbarButton
            key={alignment}
            label={label}
            disabled={!editor || disabled}
            onClick={() => {
              editor?.chain().focus().setTextAlign(alignment).run();
            }}
          >
            <span className="inline-block w-4">{icon}</span>
          </ToolbarButton>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
