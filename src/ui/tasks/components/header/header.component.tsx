import { filterMap, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils/utils';
import * as React from 'react';
import { none, some } from 'fp-ts/lib/Option';
import { Tasks } from '../../model/tasks.model';
import { createTaskValue } from '../../model/task.model';
import { filter, map, now } from '@most/core';
import { pipe } from 'fp-ts/lib/pipeable';

type Props = {
	tasks: Tasks;
};

export const Header = (props: Streamify<Props>) => {
	const handleNewKeyUp = createHandler<TargetKeyboardEvent<HTMLInputElement>>();

	const vdom = now(
		<header className={'header'}>
			<h1 className={'todos'}>todos</h1>
			<input
				className={'new-todo'}
				type="text"
				placeholder={'What needs to be done?'}
				autoFocus={true}
				name={'newTodo'}
				onKeyUp={handleNewKeyUp}
			/>
		</header>,
	);

	const value = reduce(
		props.tasks,
		pipe(
			handleNewKeyUp,
			filter(e => e.keyCode === 13),
			filterMap(e => {
				const value = e.target.value.trim();
				if (value !== '') {
					e.target.value = '';
					return some(value);
				}
				return none;
			}),
			map(title => s => [createTaskValue(title, false, false), ...s]),
		),
	);

	return {
		vdom,
		value,
	};
};
