import * as React from 'react';
import { K, Streamify } from '../../../../utils';

type Props = {
	active: number;
};

export const Footer = (props: Streamify<Props>) => {
	const vdom = K(props.active, active => (
		<footer className="footer">
			<span className="todo-count">
				<strong>{active}</strong> item left
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
		</footer>
	));

	return {
		vdom,
	};
};
