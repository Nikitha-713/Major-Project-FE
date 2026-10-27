import NoteEditor from './NoteEditor.jsx';

// Shows one editor per section of the chosen format: one box for a free-form note,
// four for SOAP, three for DAP. The sections come from the server (config/noteTemplates.js).
export default function SoapTemplate({ format, template, values, onChange }) {
  return (
    <div className="space-y-4">
      {template.sections.map((section) => (
        <NoteEditor
          key={`${format}-${section.key}`}
          id={`note-${format}-${section.key}`}
          label={section.label}
          hint={section.hint}
          value={values[section.key]}
          onChange={(doc) => onChange(section.key, doc)}
        />
      ))}
    </div>
  );
}
