import { debug, K, Streamify } from '../../../../utils/utils';
import classNames from 'classnames';
import * as React from 'react';

type Props = {
	label: string;
	path: string;
	isActive: boolean;
};

export const Link = (props: Streamify<Props>) => {
	const vdom = K(props.path, props.isActive, props.label, (path, isActive, label) => {
		const className = classNames({
			selected: isActive,
		});
		return (
			<a href={`#${path}`} className={className} draggable={false}>
				{label}
			</a>
		);
	});

	return { vdom };
};
