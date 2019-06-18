import { unsafeDeleteAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { setCompleted, TaskValue } from './task.model';

export type Tasks = TaskValue[];
export const deleteAt = (index: number) => (tasks: Tasks): Tasks => unsafeDeleteAt(index, tasks);
export const updateAt = (index: number, value: TaskValue) => (tasks: Tasks) => unsafeUpdateAt(index, value, tasks);
export const removeCompleted = (tasks: Tasks): Tasks => tasks.filter(task => !task.completed);
export const areAllCompleted = (tasks: Tasks): boolean => tasks.length > 0 && tasks.every(task => task.completed);
export const toggleAllCompleted = (completed: boolean) => (tasks: Tasks): Tasks => tasks.map(setCompleted(completed));
export const getActive = (tasks: Tasks): Tasks => tasks.filter(task => !task.completed);
export const getCompleted = (tasks: Tasks): Tasks => tasks.filter(task => task.completed);
export const remove = (value: TaskValue) => (tasks: Tasks): Tasks => tasks.filter(task => task !== value);
export const replace = (oldValue: TaskValue) => (newValue: TaskValue) => (tasks: Tasks): Tasks =>
	tasks.filter(task => (task === oldValue ? newValue : oldValue));
