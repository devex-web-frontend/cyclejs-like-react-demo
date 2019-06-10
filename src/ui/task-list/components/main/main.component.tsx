import { filterMap, K, reduce, Streamify, createHandler } from '../../../../utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task, TaskValue } from '../../../task/components/task/task.component';
import { ChangeEvent, Fragment } from 'react';
import { none, some } from 'fp-ts/lib/Option';
import { unsafeDeleteAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Endomorphism } from 'fp-ts/lib/function';
import xs from 'xstream';

type Props = {
	tasks: TaskValue[];
};

const itemKey = (task: TaskValue, i: number): string => `${i}`;

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const [handleToggleAllChange, toggleAllChangeEvent] = createHandler<ChangeEvent<HTMLInputElement>>();

	const tasks = props.tasks.fold<{ dict: Map<string, ReturnType<typeof Task>>; arr: Array<ReturnType<typeof Task>> }>(
		(acc, nextState) => {
			const { dict } = acc;
			const nextChildren = Array<ReturnType<typeof Task>>(nextState.length);
			const nextKeys = new Set<string>();

			// add
			for (let i = 0, n = nextState.length; i < n; i++) {
				const key = itemKey(nextState[i], i);
				nextKeys.add(key);
				const existing = dict.get(key);
				if (typeof existing === 'undefined') {
					const child = Task({
						value: props.tasks
							.compose(
								filterMap(tasks => {
									for (let i = 0, n = tasks.length; i < n; i++) {
										const task = tasks[i];
										if (itemKey(task, i) === key) {
											return some(task);
										}
									}
									return none;
								}),
							)
							.remember(),
					});
					const vdom = child.vdom.map(vdom => <Fragment key={key}>{vdom}</Fragment>);
					const task = {
						...child,
						vdom,
					};
					dict.set(key, task);
					nextChildren[i] = task;
				} else {
					nextChildren[i] = existing;
				}
			}

			// remove
			dict.forEach((_, key) => {
				if (!nextKeys.has(key)) {
					dict.delete(key);
				}
			});

			nextKeys.clear();

			return { dict, arr: nextChildren };
		},
		{ dict: new Map(), arr: [] },
	);

	const tasksVDom = tasks
		.map(tasks =>
			tasks.arr.length > 0
				? xs.combine(...tasks.arr.map(task => task.vdom)).map(vdoms => <Fragment>{vdoms}</Fragment>)
				: xs.of(<Fragment />),
		)
		.flatten()
		.remember();

	const tasksValue = tasks
		.map(tasks =>
			reduce(
				props.tasks,
				...tasks.arr.map((task, i) =>
					task.value.map<Endomorphism<TaskValue[]>>(value => tasks => unsafeUpdateAt(i, value, tasks)),
				),
				...tasks.arr.map((task, i) =>
					task.destroy.map<Endomorphism<TaskValue[]>>(() => tasks => unsafeDeleteAt(i, tasks)),
				),
			),
		)
		.flatten();

	const allCompleted = K(props.tasks, tasks => tasks.length > 0 && tasks.every(task => task.completed)).remember();

	const vdom = K(tasksVDom, allCompleted, (tasksVdom, allCompleted) => {
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
		tasksValue,
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
