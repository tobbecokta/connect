export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  conversation_id: string;
  message_id?: string;
  content: string;
  completed: boolean;
  priority?: TodoPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TodoFormData {
  content: string;
  priority?: TodoPriority;
  due_date?: string;
} 