import { K, reduce, Streamify, createHandler, collection, pickCombine, pickMergeMap } from '../../../../utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task, TaskValue } from '../../../task/components/task/task.component';
import { ChangeEvent, Fragment } from 'react';
import { unsafeDeleteAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import xs from 'xstream';

type Props = {
	tasks: TaskValue[];
};

const itemKey = (task: TaskValue, i: number): string => `item-${i}`;

const destroy = (_: unknown, i: number) => (tasks: TaskValue[]) => unsafeDeleteAt(i, tasks);
const update = (value: TaskValue, i: number) => (tasks: TaskValue[]) => unsafeUpdateAt(i, value, tasks);

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const [handleToggleAllChange, toggleAllChangeEvent] = createHandler<ChangeEvent<HTMLInputElement>>();

	const tasks = collection(props.tasks, Task, itemKey, children => {
		const vdom = children.compose(pickCombine('vdom', <Fragment />));

		const value = reduce(
			props.tasks,
			children.compose(pickMergeMap('destroy', destroy)),
			children.compose(pickMergeMap('value', update)),
		);

		return {
			vdom,
			value,
		};
	});

	const allCompleted = K(props.tasks, tasks => tasks.length > 0 && tasks.every(task => task.completed)).remember();

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

	const value = xs.merge(
		tasks.value,
		reduce(
			props.tasks,
			K(toggleAllChangeEvent, e => e.target.checked).map(completed => tasks =>
				tasks.map(task => ({ ...task, completed })),
			),
		),
	);

	return {
		vdom,
		value,
	};
};
