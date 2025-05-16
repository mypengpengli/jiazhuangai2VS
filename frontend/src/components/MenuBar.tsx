import React from 'react';
import { Editor } from '@tiptap/react';

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('请输入图片 URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-t-md p-2 flex flex-wrap gap-1 bg-gray-50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        加粗
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        斜体
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('strike') ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        删除线
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('paragraph') ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        段落
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        无序列表
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        有序列表
      </button>
      <button
        type="button"
        onClick={addImage}
        className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
      >
        插入图片 (URL)
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        撤销
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        重做
      </button>
    </div>
  );
};

export default MenuBar;