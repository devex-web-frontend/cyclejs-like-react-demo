import { Component } from '../../../../utils';
import { now } from '@most/core';
import * as React from 'react';

export const Footer: Component = () => {
	const vdom = now(
		<footer className="footer">
			<span className="todo-count">
				<strong>0</strong> item left
			</span>
			<ul className="filters">
				<li>
					<a className="selected" href="#/">
						All
					</a>
				</li>
				<li>
					<a href="#/active">Active</a>
				</li>
				<li>
					<a href="#/completed">Completed</a>
				</li>
			</ul>
			<button className="clear-completed">Clear completed</button>
		</footer>,
	);

	return {
		vdom,
	};
};
