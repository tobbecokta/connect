import React, { useState, useEffect } from 'react';
import { Todo as TodoType, TodoFormData, TodoPriority } from '../types/Todo';
import { getTodos, addTodo, updateTodo, deleteTodo } from '../services/supabase';
import { CalendarClock, Trash2, Plus, Check, Star, AlertCircle, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface TodoProps {
  conversationId: string;
  messageId?: string;
}

const Todo: React.FC<TodoProps> = ({ conversationId, messageId }) => {
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TodoFormData>({
    content: '',
  });

  const loadTodos = async () => {
    try {
      setIsLoading(true);
      const data = await getTodos(conversationId);
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [conversationId]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) return;
    
    try {
      const newTodo = await addTodo({
        conversationId,
        messageId,
        content: formData.content,
        priority: formData.priority,
        dueDate: formData.due_date
      });
      
      setTodos([newTodo, ...todos]);
      setFormData({ content: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed: !completed });
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const getPriorityIcon = (priority?: TodoPriority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Star className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <Star className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return <div className="py-4 text-center text-gray-500">Loading todos...</div>;
  }

  return (
    <div className="todos-container bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Tasks</h3>
        {!showForm && (
          <button
            className="bg-blue-100 text-blue-700 p-1 rounded-full hover:bg-blue-200 transition-colors"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddTodo} className="mb-4 bg-white p-3 rounded-md shadow-sm">
          <div className="flex justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">New Task</h4>
            <button 
              type="button" 
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setShowForm(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Task description"
            className="w-full p-2 border border-gray-300 rounded mb-2"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
          />
          
          <div className="flex flex-wrap gap-2 mb-2">
            <select
              className="flex-grow p-2 border border-gray-300 rounded text-sm"
              value={formData.priority || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                priority: e.target.value as TodoPriority || undefined 
              })}
            >
              <option value="">No priority</option>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            
            <input
              type="datetime-local"
              className="flex-grow p-2 border border-gray-300 rounded text-sm"
              value={formData.due_date || ''}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value || undefined })}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {todos.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No tasks yet
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className={twMerge(
                "bg-white p-3 rounded-md shadow-sm flex items-start gap-2 group",
                todo.completed && "bg-gray-50"
              )}
            >
              <button
                onClick={() => handleToggleComplete(todo.id, todo.completed)}
                className={twMerge(
                  "flex-shrink-0 h-5 w-5 rounded-full border mt-0.5",
                  todo.completed 
                    ? "bg-green-500 border-green-500 flex items-center justify-center" 
                    : "border-gray-300"
                )}
              >
                {todo.completed && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
              
              <div className="flex-grow">
                <div className="flex items-center gap-1">
                  {getPriorityIcon(todo.priority as TodoPriority)}
                  <p className={twMerge(
                    "text-sm",
                    todo.completed && "line-through text-gray-500"
                  )}>
                    {todo.content}
                  </p>
                </div>
                
                {todo.due_date && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>{formatDueDate(todo.due_date)}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Todo; 