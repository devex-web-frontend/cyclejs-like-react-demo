import { K, reduce, Streamify, createHandler, collection } from '../../../../utils/utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task } from '../task/task.component';
import { ChangeEvent } from 'react';
import { areAllCompleted, Tasks, toggleAllCompleted } from '../../model/tasks.model';
import { TaskValue } from '../../model/task.model';
import { map, merge } from '@most/core';
import { pipe } from 'fp-ts/lib/pipeable';

type Props = {
	tasks: Tasks;
	filtered: Tasks;
};

const itemKey = (task: TaskValue): string => task.id;

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const handleToggleAllChange = createHandler<ChangeEvent<HTMLInputElement>>();

	const tasks = collection(props.filtered, Task, itemKey);

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

	const tasksValue = reduce(props.tasks, tasks.reducers);

	const value = merge(
		tasksValue,
		reduce(
			props.tasks,
			pipe(
				K(handleToggleAllChange, e => e.target.checked),
				map(toggleAllCompleted),
			),
		),
	);

	return {
		vdom,
		value,
	};
};
