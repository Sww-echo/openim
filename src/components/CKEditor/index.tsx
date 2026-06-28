import "./index.scss";
import "ckeditor5/ckeditor5.css";

import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type CKEditorRef = {
  focus: (moveToEnd?: boolean) => void;
};

interface CKEditorProps {
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
}

export interface EmojiData {
  src: string;
  alt: string;
}

const keyCodes = {
  delete: 46,
  backspace: 8,
};

type CKEditorKeydownEvent = {
  stop: () => void;
};

type CKEditorKeydownData = {
  keyCode: number;
  shiftKey: boolean;
  preventDefault: () => void;
};

const Index: ForwardRefRenderFunction<CKEditorRef, CKEditorProps> = (
  { value, placeholder, onChange, onEnter },
  ref,
) => {
  const ckEditor = useRef<ClassicEditor | null>(null);
  const lastSyncedValue = useRef(value);

  const focus = (moveToEnd = false) => {
    const editor = ckEditor.current;

    if (editor) {
      const model = editor.model;
      const view = editor.editing.view;
      const root = model.document.getRoot();
      if (moveToEnd && root) {
        const range = model.createRange(model.createPositionAt(root, "end"));

        model.change((writer) => {
          writer.setSelection(range);
        });
      }
      view.focus();
    }
  };

  const listenKeydown = (editor: ClassicEditor) => {
    editor.editing.view.document.on(
      "keydown",
      (evt: CKEditorKeydownEvent, data: CKEditorKeydownData) => {
        if (data.keyCode === 13 && !data.shiftKey) {
          data.preventDefault();
          evt.stop();
          onEnter?.();
          return;
        }
        if (data.keyCode === keyCodes.backspace || data.keyCode === keyCodes.delete) {
          const selection = editor.model.document.selection;
          const hasSelectContent = !editor.model.getSelectedContent(selection).isEmpty;
          const hasEditorContent = Boolean(editor.getData());

          if (!hasEditorContent) {
            return;
          }

          if (hasSelectContent) return;
        }
      },
      { priority: "high" },
    );
  };

  useImperativeHandle(
    ref,
    () => ({
      focus,
    }),
    [],
  );

  useEffect(() => {
    const editor = ckEditor.current;

    if (!editor || lastSyncedValue.current === value) {
      return;
    }

    if (editor.getData() !== value) {
      editor.setData(value);
    }
    lastSyncedValue.current = value;
  }, [value]);

  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        placeholder,
        toolbar: [],
        image: {
          toolbar: [],
          insert: {
            type: "inline",
          },
        },
        plugins: [Essentials, Paragraph],
      }}
      onReady={(editor) => {
        ckEditor.current = editor;
        lastSyncedValue.current = editor.getData();
        listenKeydown(editor);
        focus(true);
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        lastSyncedValue.current = data;
        onChange?.(data);
      }}
    />
  );
};

export default memo(forwardRef(Index));
