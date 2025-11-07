"use client";

import { CustomEditor } from "./editor/CustomEditor";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  return (
    <div>
      <CustomEditor
        onChange={onChange}
        initialContent={initialContent}
        editable={editable}
      />
    </div>
  );
};

export default Editor;
