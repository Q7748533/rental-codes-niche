'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PendingTask {
  id: string;
  query: string;
  status: 'processing' | 'completed';
  slug?: string;
  createdAt: number;
}

export default function GlobalTaskNotifier() {
  const [completedTask, setCompletedTask] = useState<PendingTask | null>(null);

  useEffect(() => {
    // 每 5 秒扫描一次本地存储里的任务
    const interval = setInterval(async () => {
      const tasks: PendingTask[] = JSON.parse(localStorage.getItem('ai_pending_tasks') || '[]');
      if (tasks.length === 0) return;

      // 清理超过 1 小时的旧任务
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const validTasks = tasks.filter(t => t.createdAt > oneHourAgo);
      if (validTasks.length !== tasks.length) {
        localStorage.setItem('ai_pending_tasks', JSON.stringify(validTasks));
      }

      for (const task of validTasks) {
        if (task.status === 'completed') continue;

        try {
          const res = await fetch(`/api/ask/status?id=${task.id}`);
          const data = await res.json();

          if (data.found && data.slug) {
            // 标记为完成
            task.status = 'completed';
            task.slug = data.slug;
            localStorage.setItem('ai_pending_tasks', JSON.stringify(validTasks));

            // 如果用户当前不在生成页，弹出通知
            if (!window.location.pathname.includes(`/ask/${data.slug}`)) {
              setCompletedTask(task);
            }
          }
        } catch (e) { /* 忽略波动 */ }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!completedTask) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce-in">
      <div className="bg-blue-600 text-white p-4 rounded-xl shadow-2xl border-2 border-white max-w-sm">
        <p className="font-bold text-sm mb-2">🎉 Your Guide is Ready!</p>
        <p className="text-xs opacity-90 mb-3 line-clamp-1">Topic: {completedTask.query}</p>
        <div className="flex gap-2">
          <Link
            href={`/ask/${completedTask.slug}.html`}
            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
            onClick={() => setCompletedTask(null)}
          >
            View Now
          </Link>
          <button
            onClick={() => setCompletedTask(null)}
            className="text-xs opacity-70 hover:opacity-100 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
