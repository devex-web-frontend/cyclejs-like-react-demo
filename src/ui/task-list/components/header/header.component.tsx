import { createHandler, filterMap, Observify, reduce, TargetKeyboardEvent } from '../../../../utils';
import * as React from 'react';
import { of } from 'rxjs';
import { TaskValue } from '../../../task/components/task/task.component';
import { filter, map } from 'rxjs/operators';
import { cons } from 'fp-ts/lib/Array';
import { none, some } from 'fp-ts/lib/Option';

type Props = {
	tasks: TaskValue[];
};

export const Header = (props: Observify<Props>) => {
	const [handleNewKeyUp, newKeyUpEvent] = createHandler<TargetKeyboardEvent<HTMLInputElement>>();

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
		newKeyUpEvent.pipe(
			filter(e => e.keyCode === 13),
			filterMap(e => {
				const value = e.target.value.trim();
				if (value !== '') {
					e.target.value = '';
					return some(value);
				}
				return none;
			}),
			map(title => s => cons({ title, editing: false, completed: false }, s)),
		),
	);

	return {
		vdom,
		value,
	};
};
