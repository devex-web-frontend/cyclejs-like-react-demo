import { Component, K } from '../utils';
import { createAdapter } from '@most/adapter/dist';
import { ChangeEvent } from 'react';
import * as React from 'react';

type Props = {
	value: string;
};
type Sink = {
	value: string;
};

export const Input: Component<Props, Sink> = props => {
	const [handleChange, event] = createAdapter<ChangeEvent<HTMLInputElement>>();
	const value = K(event, e => e.target.value);
	const vdom = K(props.value, value => <input type="text" value={value} onChange={handleChange} />);
	return {
		vdom,
		value,
	};
};
