import { uuid } from '@devexperts/utils/dist/string';

export type TaskValue = {
	title: string;
	completed: boolean;
	editing: boolean;
	id: string;
};

export const setCompleted = (completed: boolean) => (task: TaskValue): TaskValue =>
	completed !== task.completed ? { ...task, completed } : task;
export const setEditing = (editing: boolean) => (task: TaskValue): TaskValue =>
	editing !== task.editing ? { ...task, editing } : task;
export const setTitle = (title: string) => (task: TaskValue): TaskValue =>
	task.title !== title ? { ...task, title } : task;

export const createTaskValue = (title: string, completed: boolean, editing: boolean): TaskValue => ({
	id: uuid(),
	title,
	completed,
	editing,
});
