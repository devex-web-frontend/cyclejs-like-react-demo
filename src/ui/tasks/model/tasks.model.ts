import { findFirst, unsafeDeleteAt, unsafeInsertAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { setCompleted, TaskValue } from './task.model';
import { Option } from 'fp-ts/lib/Option';

export type Tasks = TaskValue[];
export const deleteAt = (index: number) => (tasks: Tasks): Tasks => unsafeDeleteAt(index, tasks);
export const updateAt = (index: number, value: TaskValue) => (tasks: Tasks) => unsafeUpdateAt(index, value, tasks);
export const removeCompleted = (tasks: Tasks): Tasks => tasks.filter(task => !task.completed);
export const areAllCompleted = (tasks: Tasks): boolean => tasks.length > 0 && tasks.every(task => task.completed);
export const toggleAllCompleted = (completed: boolean) => (tasks: Tasks): Tasks => tasks.map(setCompleted(completed));
export const getActive = (tasks: Tasks): Tasks => tasks.filter(task => !task.completed);
export const getCompleted = (tasks: Tasks): Tasks => tasks.filter(task => task.completed);
export const prepend = (task: TaskValue) => (tasks: Tasks): Tasks => unsafeInsertAt(0, task, tasks);
export const findById = (id: string) => (tasks: Tasks): Option<TaskValue> => findFirst(tasks, task => task.id === id);
export const removeById = (id: string) => (tasks: Tasks): Tasks => tasks.filter(task => task.id !== id);
export const updateById = (id: string) => (value: TaskValue) => (tasks: Tasks): Tasks =>
	tasks.map(task => (task.id === id ? value : task));
