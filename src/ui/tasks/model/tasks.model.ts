import { setCompleted, TaskValue } from './task.model';
import { Endomorphism } from 'fp-ts/lib/function';
import { filter } from '../../../utils/utils';

export type Tasks = TaskValue[];
export const areAllCompleted = (tasks: Tasks): boolean => tasks.length > 0 && tasks.every(task => task.completed);
export const toggleAllCompleted = (completed: boolean) => (tasks: Tasks): Tasks => tasks.map(setCompleted(completed));
export const getActive: Endomorphism<Tasks> = filter(task => !task.completed);
export const getCompleted: Endomorphism<Tasks> = filter(task => task.completed);
export const remove = (value: TaskValue) => (tasks: Tasks): Tasks => tasks.filter(task => task !== value);
export const replace = (oldValue: TaskValue) => (newValue: TaskValue): Endomorphism<Tasks> => (tasks: Tasks): Tasks =>
	tasks.filter(task => (task === oldValue ? newValue : oldValue));
