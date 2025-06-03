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

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('请输入链接 URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ButtonGroup: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
    <div className="flex items-center gap-1 px-2 py-1 border-r border-gray-300 last:border-r-0" title={title}>
      {children}
    </div>
  );

  const Button: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }> = ({ onClick, disabled = false, active = false, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-3 py-2 text-sm rounded transition-all duration-200 font-medium
        ${active 
          ? 'bg-blue-500 text-white shadow-sm' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-sm active:scale-95'
        }
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-t-md bg-white shadow-sm">
      {/* 第一行：基本格式化 */}
      <div className="flex flex-wrap items-center p-2 gap-1 border-b border-gray-200">
        <ButtonGroup title="文本格式">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="加粗 (Ctrl+B)"
          >
            <strong>B</strong>
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="斜体 (Ctrl+I)"
          >
            <em>I</em>
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="删除线"
          >
            <s>S</s>
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="行内代码"
          >
            &lt;/&gt;
          </Button>
        </ButtonGroup>

        <ButtonGroup title="文字颜色">
          <input
            type="color"
            onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="设置字体颜色"
          />
          <Button
            onClick={() => editor.chain().focus().unsetColor().run()}
            disabled={!editor.can().chain().focus().unsetColor().run()}
            title="清除颜色"
          >
            清除
          </Button>
        </ButtonGroup>

        <ButtonGroup title="段落格式">
          <Button
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive('paragraph')}
            title="普通段落"
          >
            P
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="一级标题"
          >
            H1
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="二级标题"
          >
            H2
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="三级标题"
          >
            H3
          </Button>
        </ButtonGroup>
      </div>

      {/* 第二行：列表和对齐 */}
      <div className="flex flex-wrap items-center p-2 gap-1 border-b border-gray-200">
        <ButtonGroup title="列表">
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="无序列表"
          >
            • 列表
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="有序列表"
          >
            1. 列表
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="引用块"
          >
            &ldquo; 引用
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="代码块"
          >
            { } 代码
          </Button>
        </ButtonGroup>

        <ButtonGroup title="文本对齐">
          <Button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="左对齐"
          >
            ⬅
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="居中对齐"
          >
            ⬄
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="右对齐"
          >
            ➡
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="两端对齐"
          >
            ⬌
          </Button>
        </ButtonGroup>

        <ButtonGroup title="插入内容">
          <Button onClick={addImage} title="插入图片">
            🖼 图片
          </Button>
          <Button onClick={addLink} title="插入/编辑链接">
            🔗 链接
          </Button>
          <Button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="插入分隔线"
          >
            ➖ 分隔线
          </Button>
        </ButtonGroup>
      </div>

      {/* 第三行：表格操作 */}
      <div className="flex flex-wrap items-center p-2 gap-1">
        <ButtonGroup title="表格插入">
          <Button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="插入 3x3 表格"
          >
            📋 插入表格
          </Button>
        </ButtonGroup>

        <ButtonGroup title="列操作">
          <Button 
            onClick={() => editor.chain().focus().addColumnBefore().run()} 
            disabled={!editor.can().addColumnBefore()}
            title="在当前列前插入列"
          >
            ⬅+ 列
          </Button>
          <Button 
            onClick={() => editor.chain().focus().addColumnAfter().run()} 
            disabled={!editor.can().addColumnAfter()}
            title="在当前列后插入列"
          >
            +➡ 列
          </Button>
          <Button 
            onClick={() => editor.chain().focus().deleteColumn().run()} 
            disabled={!editor.can().deleteColumn()}
            title="删除当前列"
          >
            🗑 列
          </Button>
        </ButtonGroup>

        <ButtonGroup title="行操作">
          <Button 
            onClick={() => editor.chain().focus().addRowBefore().run()} 
            disabled={!editor.can().addRowBefore()}
            title="在当前行前插入行"
          >
            ⬆+ 行
          </Button>
          <Button 
            onClick={() => editor.chain().focus().addRowAfter().run()} 
            disabled={!editor.can().addRowAfter()}
            title="在当前行后插入行"
          >
            +⬇ 行
          </Button>
          <Button 
            onClick={() => editor.chain().focus().deleteRow().run()} 
            disabled={!editor.can().deleteRow()}
            title="删除当前行"
          >
            🗑 行
          </Button>
        </ButtonGroup>

        <ButtonGroup title="表格操作">
          <Button 
            onClick={() => editor.chain().focus().mergeCells().run()} 
            disabled={!editor.can().mergeCells()}
            title="合并选中的单元格"
          >
            ⬌ 合并
          </Button>
          <Button 
            onClick={() => editor.chain().focus().splitCell().run()} 
            disabled={!editor.can().splitCell()}
            title="拆分单元格"
          >
            ⬄ 拆分
          </Button>
          <Button 
            onClick={() => editor.chain().focus().toggleHeaderCell().run()} 
            disabled={!editor.can().toggleHeaderCell()}
            title="切换表头单元格"
          >
            📋 表头
          </Button>
          <Button 
            onClick={() => editor.chain().focus().deleteTable().run()} 
            disabled={!editor.can().deleteTable()}
            title="删除整个表格"
          >
            🗑 表格
          </Button>
        </ButtonGroup>

        <ButtonGroup title="撤销重做">
          <Button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 (Ctrl+Z)"
          >
            ↶ 撤销
          </Button>
          <Button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 (Ctrl+Y)"
          >
            ↷ 重做
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default MenuBar;