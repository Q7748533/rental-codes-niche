import JsonImportForm from '../components/JsonImportForm';

export const dynamic = 'force-dynamic';

export default function ImportPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">导入代码数据</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold leading-6 text-gray-900">批量导入</h3>
          <p className="text-sm text-gray-500 mt-1">上传 JSON 文件批量导入租车优惠代码</p>
        </div>
        <div className="p-6">
          <JsonImportForm />
        </div>
      </div>
    </div>
  );
}
