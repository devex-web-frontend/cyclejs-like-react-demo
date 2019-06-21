import * as React from 'react';
import { createHandler, K, reduce, streamify, Streamify } from '../../../../utils/utils';
import { MouseEvent } from 'react';
import { Location } from 'history';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { LinkContainer } from '../../../ui-kit/containers/link.container';
import { getActive, Tasks } from '../../model/tasks.model';
import { pipe } from '../../../../utils/pipe.utils';
import { map } from '@most/core';

type Props = {
	tasks: Tasks;
	activeCount: number;
	completedCount: number;
	location: Location;
};

const Filters = combineReader(LinkContainer, LinkContainer => () => {
	const all = LinkContainer(
		streamify({
			label: 'All',
			path: '/',
		}),
	);
	const active = LinkContainer(
		streamify({
			label: 'Active',
			path: '/active',
		}),
	);
	const completed = LinkContainer(
		streamify({
			label: 'Completed',
			path: '/completed',
		}),
	);
	const vdom = K(all.vdom, active.vdom, completed.vdom, (all, active, completed) => (
		<ul className="filters">
			<li>{all}</li>
			<li>{active}</li>
			<li>{completed}</li>
		</ul>
	));
	return { vdom };
});

export const Footer = combineReader(Filters, Filters => (props: Streamify<Props>) => {
	const handleClearCompletedClick = createHandler<MouseEvent<HTMLButtonElement>>();

	const pathname = K(props.location, location => location.pathname);
	const filters = Filters();

	const vdom = K(
		props.activeCount,
		props.completedCount,
		pathname,
		filters.vdom,
		(active, completed, pathname, filters) => (
			<footer className="footer">
				<span className="todo-count">
					<strong>{active}</strong> item{active !== 1 ? 's' : ''} left
				</span>
				{filters}
				{completed > 0 && (
					<button className="clear-completed" onClick={handleClearCompletedClick}>
						Clear completed
					</button>
				)}
			</footer>
		),
	);

	const value = reduce(
		props.tasks,
		pipe(
			handleClearCompletedClick,
			map(() => getActive),
		),
	);

	return {
		vdom,
		value,
	};
});
