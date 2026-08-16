
import { TextEditor } from '@celestia-project/ui';
import { useTheme } from '@/components/theme-provider';
import { type CustomSection } from '../types';

interface CustomSectionCodeEditorProps {
  documentId: string;
  section: CustomSection;
  onChange: (content: string) => void;
}

export function CustomSectionCodeEditor({
  documentId,
  section,
  onChange,
}: CustomSectionCodeEditorProps) {
  const { theme } = useTheme();

  return (
    <TextEditor
      path={`${documentId}/sections/${section.key}.md`}
      value={section.content}
      onChange={(value) => onChange(value ?? '')}
      language="markdown"
      detectLinks={true}
      theme={theme}
    />
  );
}
