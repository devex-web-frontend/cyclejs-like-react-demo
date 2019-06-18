import {
	K,
	reduce,
	Streamify,
	createHandler,
	collection,
	pickMergeMapAll,
	pickCombineAll,
	filterMap,
	debug,
} from '../../../../utils/utils';
import * as React from 'react';
import { randomId } from '@devexperts/utils/dist/string';
import { Task } from '../task/task.component';
import { ChangeEvent, createElement, Fragment } from 'react';
import {
	areAllCompleted,
	deleteAt,
	removeById,
	Tasks,
	toggleAllCompleted,
	updateAt,
	updateById,
} from '../../model/tasks.model';
import { TaskValue } from '../../model/task.model';
import pipe from 'callbag-pipe';
import merge from 'callbag-merge';
import map from 'callbag-map';
import { lookup } from 'fp-ts/lib/Array';
import remember from 'callbag-remember';
import combine from 'callbag-combine';
import flatten from 'callbag-flatten';
import of from 'callbag-of';
import dropRepeats from 'callbag-drop-repeats';
import { Sink, Source } from 'callbag';
import scan from 'callbag-scan';
import makeSubject from 'callbag-subject';
import startWith from 'callbag-start-with';
import { constant } from 'fp-ts/lib/function';
import share from 'callbag-share';

type Props = {
	tasks: Tasks;
	filtered: Tasks;
};

const itemKey = (task: TaskValue, i: number): string => task.id;

export const Main = (props: Streamify<Props>) => {
	const toggleAllId = randomId('toggle-all-');
	const handleToggleAllChange = createHandler<ChangeEvent<HTMLInputElement>>();

	type Child = ReturnType<typeof Task>;
	type Stored = {
		value: Sink<TaskValue>;
		destroy: Source<string>;
		child: Child;
	};
	type State = {
		storage: Map<string, Stored>;
		children: Child[];
	};
	const initial: State = {
		storage: new Map(),
		children: [],
	};

	debug(props.tasks, 'props.tasks');

	const state = pipe(
		props.tasks,
		scan((acc, nextState) => {
			console.log('scan', nextState);
			// reset next children
			const nextLength = nextState.length;
			acc.children = Array(nextLength);
			const nextKeys = new Set<string>();

			// add
			for (let i = 0; i < nextState.length; i++) {
				const nextValue = nextState[i];
				const key = itemKey(nextValue, i);
				nextKeys.add(key);
				const existing = acc.storage.get(key);
				if (typeof existing === 'undefined') {
					// no stored child for i
					const value = makeSubject<TaskValue>();
					const child = Task({
						value: pipe(
							value,
							startWith(nextValue),
							dropRepeats(),
							share,
							remember,
						),
					});
					const vdom = pipe(
						child.vdom,
						map(vdom => createElement(Fragment, { key }, vdom)),
					);
					const destroy = pipe(
						child.destroy,
						map(constant(key)),
					);
					const result = {
						value,
						destroy,
						child: {
							...child,
							vdom,
						},
					};
					acc.storage.set(key, result);
					acc.children[i] = result.child;
				} else {
					// push value to existing child
					console.log('existing', nextValue);
					existing.value(1, nextValue);
					acc.children[i] = existing.child;
				}
			}

			// remove
			acc.storage.forEach((_, key) => {
				if (!nextKeys.has(key)) {
					acc.storage.delete(key);
				}
			});

			nextKeys.clear();

			return acc;
		}, initial),
		share,
		remember,
	);

	const tasksVDom = pipe(
		state,
		map(state => combine(...state.children.map(child => child.vdom))),
		flatten,
	);

	// const destroy = pipe(
	// 	// state,
	// 	// map(children =>
	// 	// 	merge(
	// 	// 		...state.children.map(child => {
	// 	// 			return child.destroy;
	// 	// 		}),
	// 	// 	),
	// 	// ),
	//
	// 	// flatten,
	// 	props.tasks,
	//
	// );

	const entries = pipe(
		state,
		map(state => Array.from(state.storage)),
		remember,
	);

	const tasksValue = reduce(
		props.tasks,
		// pipe(
		// 	state,
		// 	map(state =>
		// 		merge(
		// 			...Array.from(state.storage.values()).map(child =>
		// 				pipe(
		// 					child.destroy,
		// 					map(removeById),
		// 				),
		// 			),
		// 		),
		// 	),
		// 	flatten,
		// ),
		pipe(
			entries,
			map(entries => {
				console.log('mapping entries', entries);
				return merge(
					...entries.map(([key, stored]) =>
						pipe(
							stored.child.value,
							map(value => {
								return (tasks: TaskValue[]) => {
									console.log('updating', key, value);
									return updateById(key)(value)(tasks);
								};
							}),
						),
					),
				);
			}),
			flatten,
		),
		pipe(
			entries,
			map(entries => entries.map(([key, value]) => value)),
			pickMergeMapAll('destroy', removeById),
		),
		// pipe(state, map(state => state.children), pickMergeMapAll('destroy', id => removeById(id))
	);

	// const tasksValue = reduce(
	// 	props.tasks,
	// 	pipe(
	// 		state,
	// 		// map(children => {
	// 		// 	children.map(child => child.destroy);
	// 		// }),
	// 		pickMergeMapAll('destroy', (_, i) => deleteAt(i)),
	// 	),
	// 	pipe(
	// 		state,
	// 		pickMergeMapAll('value', (task, i) => updateAt(i, task)),
	// 	),
	// );

	//
	// const tasksVDom = pipe(
	// 	props.filtered,
	// 	map(filtered => {
	// 		const children = filtered.map((task, i) => {
	// 			const value = pipe(
	// 				of(task),
	// 				// filterMap(filtered => {
	// 				// 	console.log('looking up', i, lookup(i, filtered));
	// 				// 	return lookup(i, filtered);
	// 				// }),
	// 				dropRepeats(),
	// 				remember,
	// 			);
	// 			const child = Task({ value });
	// 			const vdom = pipe(
	// 				child.vdom,
	// 				map(vdom => <Fragment key={i}>{vdom}</Fragment>),
	// 			);
	// 			return {
	// 				...child,
	// 				vdom,
	// 			};
	// 		});
	//
	// 		const vdom = combine(...children.map(child => child.vdom));
	// 		return vdom;
	// 	}),
	// 	flatten,
	// );

	// const tasks = collection(props.filtered, Task, itemKey, children => {
	// 	const vdom = pipe(
	// 		children,
	// 		pickCombineAll('vdom'),
	// 	);
	//
	// 	const value = reduce(
	// 		props.tasks,
	// 		pipe(
	// 			children,
	// 			pickMergeMapAll('destroy', (_, i) => deleteAt(i)),
	// 		),
	// 		pipe(
	// 			children,
	// 			pickMergeMapAll('value', (task, i) => updateAt(i, task)),
	// 		),
	// 	);
	//
	// 	return {
	// 		vdom,
	// 		value,
	// 	};
	// });

	const allCompleted = K(props.tasks, areAllCompleted);

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

	const value = merge(
		// tasks.value,
		tasksValue,
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
