'use client';

export default function DeleteButton() {
  return (
    <button
      type="submit"
      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
      onClick={(e) => {
        if (!confirm('确定要删除这条代码吗？')) {
          e.preventDefault();
        }
      }}
    >
      删除
    </button>
  );
}
