// Renders a saved note (TipTap JSON) as React elements. It never uses dangerouslySetInnerHTML,
// so note content can not inject markup or scripts, in the therapist view or in the client portal.
const MARKS = {
  bold: (el) => <strong>{el}</strong>,
  italic: (el) => <em>{el}</em>,
  strike: (el) => <s>{el}</s>,
  code: (el) => <code>{el}</code>,
};

function Node({ node }) {
  const kids = (node.content || []).map((child, i) => <Node key={i} node={child} />);
  switch (node.type) {
    case 'text':
      return (node.marks || []).reduce((el, m) => (MARKS[m.type] ? MARKS[m.type](el) : el), node.text);
    case 'paragraph':
      return <p>{kids.length ? kids : <br />}</p>;
    case 'heading': {
      const Tag = `h${[1, 2, 3].includes(node.attrs && node.attrs.level) ? node.attrs.level : 2}`;
      return <Tag>{kids}</Tag>;
    }
    case 'bulletList': return <ul>{kids}</ul>;
    case 'orderedList': return <ol>{kids}</ol>;
    case 'listItem': return <li>{kids}</li>;
    case 'blockquote': return <blockquote>{kids}</blockquote>;
    case 'codeBlock': return <pre><code>{kids}</code></pre>;
    case 'hardBreak': return <br />;
    case 'horizontalRule': return <hr />;
    default: return null; // unknown node types are ignored, never rendered as HTML
  }
}

export default function RichTextView({ doc }) {
  if (!doc || !Array.isArray(doc.content)) return null;
  return (
    <div className="note-prose text-sm leading-relaxed">
      {doc.content.map((node, i) => <Node key={i} node={node} />)}
    </div>
  );
}
