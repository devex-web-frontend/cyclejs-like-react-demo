import {
	K,
	reduce,
	Streamify,
	createHandler,
	collection,
	pickMergeMapAll,
	pickCombineAll,
} from '../../../../utils/utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task } from '../task/task.component';
import { ChangeEvent } from 'react';
import { areAllCompleted, deleteAt, Tasks, toggleAllCompleted, updateAt } from '../../model/tasks.model';
import { TaskValue } from '../../model/task.model';
import pipe from 'callbag-pipe';
import merge from 'callbag-merge';
import map from 'callbag-map';

type Props = {
	tasks: Tasks;
	filtered: Tasks;
};

const itemKey = (task: TaskValue, i: number): string => `item-${i}`;

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const handleToggleAllChange = createHandler<ChangeEvent<HTMLInputElement>>();

	const tasks = collection(props.filtered, Task, itemKey, children => {
		const vdom = pipe(
			children,
			pickCombineAll('vdom'),
		);

		const value = reduce(
			props.tasks,
			pipe(
				children,
				pickMergeMapAll('destroy', (_, i) => deleteAt(i)),
			),
			pipe(
				children,
				pickMergeMapAll('value', (task, i) => updateAt(i, task)),
			),
		);

		return {
			vdom,
			value,
		};
	});

	const allCompleted = K(props.tasks, areAllCompleted);

	const vdom = K(tasks.vdom, allCompleted, (tasksVdom, allCompleted) => {
		return (
			<section className={'main'}>
				<input
					type="checkbox"
					className={'toggle-all'}
					id={toggleAllId}
					checked={allCompleted}
					onChange={handleToggleAllChange}
				/>
				<label htmlFor={toggleAllId}>Mark all as comlete</label>
				<ul className="todo-list">{tasksVdom}</ul>
			</section>
		);
	});

	const value = merge(
		tasks.value,
		reduce(
			props.tasks,
			pipe(
				handleToggleAllChange.source,
				map(e => toggleAllCompleted(e.target.checked)),
			),
		),
	);

	return {
		vdom,
		value,
	};
};
