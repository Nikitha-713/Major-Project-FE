import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function Tool({ label, text, active, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
        active ? 'bg-tide text-white' : 'bg-white text-ink ring-1 ring-mist hover:bg-fog'
      }`}
    >
      {text}
    </button>
  );
}

// Rich text box. `value` is only the starting content: give it a new `key` to load different content.
export default function NoteEditor({ id, label, hint, value, onChange }) {
  const labelId = `${id}-label`;
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: value || undefined,
    editorProps: {
      attributes: {
        class: 'note-prose min-h-[7rem] px-3 py-2 text-sm leading-relaxed',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
  });

  if (!editor) return null;
  const chain = () => editor.chain().focus();

  return (
    <div>
      <p id={labelId} className="text-sm font-semibold">{label}</p>
      {hint && <p className="mb-1.5 text-xs text-ink/60">{hint}</p>}
      <div className="rounded-lg bg-white ring-1 ring-mist focus-within:ring-2 focus-within:ring-signal">
        <div className="flex flex-wrap gap-1.5 border-b border-mist p-2" role="toolbar" aria-label={`${label} formatting`}>
          <Tool label="Bold" text="B" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()} />
          <Tool label="Italic" text="I" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()} />
          <Tool label="Heading" text="H" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
          <Tool label="Bulleted list" text="• List" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()} />
          <Tool label="Numbered list" text="1. List" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()} />
          <Tool label="Quote" text="Quote" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()} />
          <Tool label="Undo" text="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()} />
          <Tool label="Redo" text="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()} />
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
