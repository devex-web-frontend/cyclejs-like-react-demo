import { filterMap, K, log, pipe, reduce, Streamify, voidSink } from '../../../../utils';
import {
	chain,
	combineArray,
	empty,
	filter,
	map,
	mergeArray,
	multicast,
	now,
	scan,
	skipRepeats,
	snapshot,
	startWith,
	switchLatest,
} from '@most/core';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task, TaskValue } from '../../../task/components/task/task.component';
import { Fragment } from 'react';
import { hold } from '@most/hold';
import { none, some } from 'fp-ts/lib/Option';
import { newDefaultScheduler } from '@most/scheduler';
import { constVoid, Endomorphism } from 'fp-ts/lib/function';
import { unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Stream } from '@most/types';

type Props = {
	tasks: TaskValue[];
};

const itemKey = (task: TaskValue, i: number): string => `${i}`;

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');

	const tasks = pipe(
		props.tasks,
		skipRepeats,
		scan<TaskValue[], { dict: Map<string, ReturnType<typeof Task>>; arr: Array<ReturnType<typeof Task>> }>(
			(acc, nextState) => {
				const { dict } = acc;
				const nextChildren = Array<ReturnType<typeof Task>>(nextState.length);
				const nextKeys = new Set<string>();

				// add
				for (let i = 0, n = nextState.length; i < n; ++i) {
					const key = itemKey(nextState[i], i);
					nextKeys.add(key);
					const existing = dict.get(key);
					if (typeof existing === 'undefined') {
						const child = Task({
							value: pipe(
								props.tasks,
								startWith(nextState),
								filterMap(tasks => {
									for (let i = 0, n = tasks.length; i < n; i++) {
										const task = tasks[i];
										if (itemKey(task, i) === key) {
											return some(task);
										}
									}
									return none;
								}),
							),
						});
						const vdom = map(vdom => <Fragment key={key}>{vdom}</Fragment>, child.vdom);
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
		),
		// multicast,
	);

	const tasksVDom = pipe(
		tasks,
		map(tasks => combineArray((...vdoms) => <Fragment>{vdoms}</Fragment>, tasks.arr.map(task => task.vdom))),
		switchLatest,
	);

	const tasksValue: Stream<TaskValue[]> = pipe(
		tasks,
		chain(tasks => {
			console.log('tasks', tasks);
			return multicast(
				mergeArray(
					tasks.arr.map((task, i) => {
						console.log('snapshotting', task, i);
						return snapshot(
							(tasks, task) => {
								console.log('FOO', tasks, task, i);
								return unsafeUpdateAt(i, task, tasks);
							},
							props.tasks,
							task.value,
						);
					}),
				),
			);
		}),
		// chain(tasks => {
		// 	return reduce(
		// 		props.tasks,
		// 		...tasks.arr.map((task, i) =>
		// 			pipe(
		// 				task.value,
		// 				log('task value', i),
		// 				map<TaskValue, Endomorphism<TaskValue[]>>(value => tasks => {
		// 					console.log('updating', i, value, tasks);
		// 					return unsafeUpdateAt(i, value, tasks);
		// 				}),
		// 			),
		// 		),
		// 	);
		// }),
		log('tasks2'),
	);

	const vdom = K(tasksVDom, tasksVdom => (
		<section className={'main'}>
			<input type="checkbox" className={'toggle-all'} id={toggleAllId} />
			<label htmlFor={toggleAllId}>Mark all as comlete</label>
			<ul className="todo-list">{tasksVdom}</ul>
		</section>
	));
	return {
		vdom,
		value: tasksValue,
	};
};
