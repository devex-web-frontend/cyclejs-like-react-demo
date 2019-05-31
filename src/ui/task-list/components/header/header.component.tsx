import { Component } from '../../../../utils';
import * as React from 'react';
import { of } from 'rxjs';

export const Header: Component = () => {
	const vdom = of(
		<header className={'header'}>
			<h1 className={'todos'}>todos</h1>
			<input
				className={'new-todo'}
				type="text"
				placeholder={'What needs to be done?'}
				autoFocus={true}
				name={'newTodo'}
			/>
		</header>,
	);
	return {
		vdom,
	};
};
