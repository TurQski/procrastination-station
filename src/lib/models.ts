export type Task = {
  id: string; goal_id: string; title: string; description: string;
  estimated_minutes: number; due_date: string; position: number;
  completed: boolean; created_at: string;
};
export type Goal = {
  id: string; user_id: string; title: string; description: string;
  deadline: string; created_at: string; updated_at: string; tasks: Task[];
};
export function progress(tasks: Pick<Task, "completed">[]): number {
  return tasks.length ? Math.round(tasks.filter((task) => task.completed).length / tasks.length * 100) : 0;
}
