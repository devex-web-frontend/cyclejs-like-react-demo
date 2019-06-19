import { filterMap, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils/utils';
import * as React from 'react';
import { none, some } from 'fp-ts/lib/Option';
import { prepend, Tasks } from '../../model/tasks.model';
import pipe from 'callbag-pipe';
import filter from 'callbag-filter';
import map from 'callbag-map';
import of from 'callbag-of';
import { createTaskValue } from '../../model/task.model';

type Props = {
	tasks: Tasks;
};

export const Header = (props: Streamify<Props>) => {
	const handleNewKeyUp = createHandler<TargetKeyboardEvent<HTMLInputElement>>();

	const vdom = of(
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
			handleNewKeyUp.source,
			filter(e => e.keyCode === 13),
			filterMap(e => {
				const value = e.target.value.trim();
				if (value !== '') {
					e.target.value = '';
					return some(value);
				}
				return none;
			}),
			map(title => prepend(createTaskValue(title, false, false))),
		),
	);

	return {
		vdom,
		value,
	};
};
