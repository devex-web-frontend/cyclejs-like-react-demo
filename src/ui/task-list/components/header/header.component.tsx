import { Component } from '../../../../utils';
import { now } from '@most/core';
import * as React from 'react';

export const Header: Component = () => {
	const vdom = now(
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
