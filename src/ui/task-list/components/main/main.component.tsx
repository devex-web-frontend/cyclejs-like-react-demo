import { filterMap, K, pipe, reduce, Observify, createHandler, log } from '../../../../utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task, TaskValue } from '../../../task/components/task/task.component';
import { ChangeEvent, Fragment } from 'react';
import { none, some } from 'fp-ts/lib/Option';
import { unsafeDeleteAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { map, mergeMap, scan, startWith, switchMap } from 'rxjs/operators';
import { combineLatest, merge, Observable, of } from 'rxjs';
import { Endomorphism } from 'fp-ts/lib/function';

type Props = {
	tasks: TaskValue[];
};

const itemKey = (task: TaskValue, i: number): string => `${i}`;

export const Main = (props: Observify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const [handleToggleAllChange, toggleAllChangeEvent] = createHandler<ChangeEvent<HTMLInputElement>>();

	const tasks = props.tasks.pipe(
		scan<TaskValue[], { dict: Map<string, ReturnType<typeof Task>>; arr: Array<ReturnType<typeof Task>> }>(
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
							value: props.tasks.pipe(
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
						const vdom = child.vdom.pipe(map(vdom => <Fragment key={key}>{vdom}</Fragment>));
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
	);

	const tasksVDom = tasks.pipe(
		switchMap(tasks => combineLatest(tasks.arr.map(task => task.vdom))),
		map(vdoms => <Fragment>{vdoms}</Fragment>),
	);

	const tasksValue: Observable<TaskValue[]> = pipe(
		tasks,
		switchMap(tasks =>
			reduce(
				props.tasks,
				...tasks.arr.map((task, i) =>
					pipe(
						task.value,
						map<TaskValue, Endomorphism<TaskValue[]>>(value => tasks => unsafeUpdateAt(i, value, tasks)),
					),
				),
				...tasks.arr.map((task, i) =>
					pipe(
						task.destroy,
						map<void, Endomorphism<TaskValue[]>>(() => tasks => unsafeDeleteAt(i, tasks)),
					),
				),
			),
		),
	);

	const vdom = K(tasksVDom, tasksVdom => (
		<section className={'main'}>
			<input type="checkbox" className={'toggle-all'} id={toggleAllId} onChange={handleToggleAllChange} />
			<label htmlFor={toggleAllId}>Mark all as comlete</label>
			<ul className="todo-list">{tasksVdom}</ul>
		</section>
	));

	const value: Observable<TaskValue[]> = merge(
		tasksValue,
		reduce(
			props.tasks,
			K(toggleAllChangeEvent, e => e.target.checked).pipe(
				map(completed => tasks => tasks.map(task => ({ ...task, completed }))),
			),
		),
	);

	return {
		vdom,
		value,
	};
};
