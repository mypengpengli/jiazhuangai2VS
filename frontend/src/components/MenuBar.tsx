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
    <div className="border border-gray-300 rounded-t-md p-2 flex flex-wrap gap-1 bg-gray-50 items-center">
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
      <input
        type="color"
        onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="w-8 h-8 p-0 border-none rounded cursor-pointer"
        title="设置字体颜色"
      />
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetColor().run()}
        disabled={!editor.can().chain().focus().unsetColor().run()}
        className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
        title="清除颜色"
      >
        清除颜色
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
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        左对齐
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        居中
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        右对齐
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        两端对齐
      </button>
      <button
        type="button"
        onClick={addImage}
        className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
      >
        插入图片 (URL)
      </button>
      {/* Table Controls */}
      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
      >
        插入表格
      </button>
      <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">前增列</button>
      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">后增列</button>
      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">删列</button>
      <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">前增行</button>
      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">后增行</button>
      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">删行</button>
      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">删表</button>
      <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">合单元</button>
      <button type="button" onClick={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">拆单元</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeaderCell().run()} disabled={!editor.can().toggleHeaderCell()} className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50">转表头</button>

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