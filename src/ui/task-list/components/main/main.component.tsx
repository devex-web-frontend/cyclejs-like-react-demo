import { K, reduce, Streamify, createHandler, collection, chain } from '../../../../utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task, TaskValue } from '../../../task/components/task/task.component';
import { ChangeEvent, Fragment } from 'react';
import { unsafeDeleteAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Endomorphism } from 'fp-ts/lib/function';
import xs from 'xstream';
import { createElement } from 'react';

type Props = {
	tasks: TaskValue[];
};

const itemKey = (task: TaskValue, i: number): string => `item-${i}`;

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const [handleToggleAllChange, toggleAllChangeEvent] = createHandler<ChangeEvent<HTMLInputElement>>();

	const tasks = collection(props.tasks, Task, itemKey, tasks => {
		const vdom = tasks.compose(
			chain(tasks =>
				tasks.length > 0
					? xs.combine(...tasks.map(task => task.vdom)).map(vdoms => createElement(Fragment, null, vdoms))
					: xs.of(createElement(Fragment)),
			),
		);
		const value = tasks.compose(
			chain(tasks =>
				reduce(
					props.tasks,
					...tasks.map((task, i) =>
						task.value.map<Endomorphism<TaskValue[]>>(value => tasks => unsafeUpdateAt(i, value, tasks)),
					),
					...tasks.map((task, i) =>
						task.destroy.map<Endomorphism<TaskValue[]>>(() => tasks => unsafeDeleteAt(i, tasks)),
					),
				),
			),
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
