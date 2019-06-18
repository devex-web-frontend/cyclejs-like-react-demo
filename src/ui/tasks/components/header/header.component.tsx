import { filterMap, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils/utils';
import * as React from 'react';
import { none, some } from 'fp-ts/lib/Option';
import { Stream } from 'xstream';
import { Tasks } from '../../model/tasks.model';
import { createTaskValue } from '../../model/task.model';

type Props = {
	tasks: Tasks;
};

export const Header = (props: Streamify<Props>) => {
	const handleNewKeyUp = createHandler<TargetKeyboardEvent<HTMLInputElement>>();

	const vdom = Stream.of(
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
		handleNewKeyUp
			.filter(e => e.keyCode === 13)
			.compose(
				filterMap(e => {
					const value = e.target.value.trim();
					if (value !== '') {
						e.target.value = '';
						return some(value);
					}
					return none;
				}),
			)
			.map(title => s => [createTaskValue(title, false, false), ...s]),
	);

	return {
		vdom,
		value,
	};
};
